"""
Feature Fusion and Yield Prediction Module for MangoSense

Two paths:

1. REGRESSOR path — active only when a REAL (non-synthetic) models/yield_model.pkl
   exists. Synthetic bundles (train_yield_regressor.py --allow-synthetic) are
   flagged `synthetic: true` and are NEVER loaded here.
   -> trained: true,  method: "regressor",      modelVersion: "mangosense-yield-v1"

2. RULE-BASED path (current default) — no numeric-yield dataset exists yet, so the
   yield range is computed from the REAL request inputs: bud health
   (= P(GOOD) * 100 from the CNN, or the caller's budHealth) plus climate
   (temperature/humidity/rainfall/wind/soil) and variety. No random constants.
   -> trained: false, method: "rule_based_pending_yield_dataset",
      modelVersion: "mangosense-yield-rule-v1"

Both paths return the exact flattened shape from CONTRACT.md §2.
"""

import os
import pickle
import yaml
import numpy as np
from typing import Dict, Any, List, Optional

CONFIG_PATH = "config/model_config.yaml"
CLIMATE_FEATURE_DIM = 6   # normalize_climate_vector output
VARIETY_FEATURE_DIM = 1


class FeatureFusionPipeline:
    def __init__(self, model_path: str = "models/yield_model.pkl",
                 config_path: str = CONFIG_PATH):
        self.model_path = model_path
        self.regressor = None
        self.scaler = None
        self.bundle_feature_dim: Optional[int] = None

        # Config: CNN feature dimension + model version strings
        self.config: Dict[str, Any] = {}
        if os.path.isfile(config_path):
            with open(config_path, "r") as f:
                self.config = yaml.safe_load(f) or {}
        self.config_cnn_feature_dim = int(
            self.config.get("cnn", {}).get("feature_dim", 576)
        )
        self.rule_version = str(
            self.config.get("model_versions", {}).get("yield_rule", "mangosense-yield-rule-v1")
        )
        self.regressor_version = str(
            self.config.get("model_versions", {}).get("yield_regressor", "mangosense-yield-v1")
        )

        if os.path.isfile(model_path):
            try:
                with open(model_path, "rb") as f:
                    bundle = pickle.load(f)
                if isinstance(bundle, dict) and bundle.get("synthetic"):
                    print(f"[FeatureFusion] REFUSING to load {model_path}: bundle is flagged "
                          f"synthetic=true (trained on synthetic data). Rule-based path will be used.")
                elif isinstance(bundle, dict) and bundle.get("model") is not None:
                    self.regressor = bundle.get("model")
                    self.scaler = bundle.get("scaler")
                    self.bundle_feature_dim = int(bundle.get("feature_dim", 0)) or None
                    print(f"[FeatureFusion] Loaded REAL yield regressor "
                          f"({bundle.get('model_name', '?')}) from {model_path}, "
                          f"feature_dim={self.bundle_feature_dim}")
                else:
                    print(f"[FeatureFusion] {model_path} has no usable 'model' key; "
                          f"using rule-based path.")
            except Exception as e:
                print(f"[FeatureFusion] Error loading regressor: {e}. Using rule-based path.")

    # ------------------------------------------------------------------
    @property
    def cnn_feature_dim(self) -> int:
        """
        CNN feature slots used in the fused vector. Computed from the bundle when a
        regressor is loaded (bundle total minus climate+variety slots), otherwise
        from config cnn.feature_dim. Keeps train/inference/fusion dims consistent.
        """
        if self.bundle_feature_dim:
            cnn_slots = self.bundle_feature_dim - CLIMATE_FEATURE_DIM - VARIETY_FEATURE_DIM
            if cnn_slots > 0:
                return cnn_slots
        return self.config_cnn_feature_dim

    # ------------------------------------------------------------------
    def normalize_climate_vector(self, climate: Dict[str, Any]) -> np.ndarray:
        """
        Normalize environmental parameters:
        [temperature, humidity, rainfall, wind_speed, vpd, soil_moisture]
        """
        temp = float(climate.get("temperature", 29.0))
        hum = float(climate.get("humidity", 68.0))
        rain = float(climate.get("rainfall", 2.0))
        wind = float(climate.get("windSpeed", climate.get("wind_speed", 12.0)))

        vpd_str = str(climate.get("vaporPressureDeficit", climate.get("vpd", "1.3"))).replace("kPa", "").strip()
        try:
            vpd = float(vpd_str) if vpd_str else 1.3
        except ValueError:
            vpd = 1.3

        soil_str = str(climate.get("soilMoisture", climate.get("soil_moisture", "34"))).replace("%", "").strip()
        try:
            soil = float(soil_str) if soil_str else 34.0
        except ValueError:
            soil = 34.0

        # Feature normalization bounds
        norm_temp = (temp - 15.0) / 30.0  # expected range 15 - 45 C
        norm_hum = hum / 100.0            # 0 - 100 %
        norm_rain = min(rain / 50.0, 1.0)  # 0 - 50 mm
        norm_wind = min(wind / 40.0, 1.0)  # 0 - 40 km/h
        norm_vpd = vpd / 3.0               # 0 - 3 kPa
        norm_soil = soil / 100.0           # 0 - 100 %

        return np.array([norm_temp, norm_hum, norm_rain, norm_wind, norm_vpd, norm_soil], dtype=np.float32)

    def fuse_features(
        self,
        cnn_features: List[float],
        climate_vector: np.ndarray,
        variety_factor: float = 1.0
    ) -> np.ndarray:
        """
        Concatenates the CNN feature vector (padded/truncated to the expected
        feature_dim so train/inference/fusion stay consistent), climate telemetry
        and the variety encoding.
        """
        target = self.cnn_feature_dim
        cnn_arr = np.zeros(target, dtype=np.float32)
        if cnn_features:
            src = np.asarray(cnn_features, dtype=np.float32).ravel()
            n = min(len(src), target)
            cnn_arr[:n] = src[:n]

        variety_arr = np.array([variety_factor], dtype=np.float32)
        return np.concatenate([cnn_arr, climate_vector, variety_arr])

    # ------------------------------------------------------------------
    @staticmethod
    def variety_factor(variety: str) -> float:
        variety_map = {
            "alphonso": 1.0,
            "hapus": 1.0,
            "kesar": 1.12,
            "dasheri": 0.95,
            "banganapalli": 1.2,
            "totapuri": 1.25,
        }
        var_key = (variety or "alphonso").lower().split()[0]
        return variety_map.get(var_key, 1.0)

    def _climate_scores(self, climate: Dict[str, Any]) -> Dict[str, float]:
        """
        Agronomic suitability sub-scores in [0, 1] computed from the REAL climate
        inputs. 1.0 = within the optimal band for that variable.
        """
        def band(value: float, lo: float, hi: float, tol: float) -> float:
            if lo <= value <= hi:
                return 1.0
            dist = (lo - value) if value < lo else (value - hi)
            return max(0.0, 1.0 - dist / tol)

        temp = float(climate.get("temperature", 29.0))
        hum = float(climate.get("humidity", 68.0))
        rain = float(climate.get("rainfall", 2.0))
        wind = float(climate.get("windSpeed", climate.get("wind_speed", 12.0)))
        soil_str = str(climate.get("soilMoisture", climate.get("soil_moisture", "34"))).replace("%", "").strip()
        try:
            soil = float(soil_str) if soil_str else 34.0
        except ValueError:
            soil = 34.0

        temp_s = band(temp, 24.0, 33.0, 15.0)
        hum_s = band(hum, 55.0, 85.0, 50.0)
        if rain < 2.0:                     # drought stress
            rain_s = max(0.3, rain / 2.0)
        elif rain <= 20.0:                 # optimal for mango flowering/fruit set
            rain_s = 1.0
        else:                              # excess rain / waterlogging risk
            rain_s = max(0.2, 1.0 - (rain - 20.0) / 40.0)
        soil_s = band(soil, 30.0, 70.0, 60.0)
        wind_s = 1.0 if wind <= 25.0 else max(0.0, 1.0 - (wind - 25.0) / 40.0)

        scores = {"temperature": temp_s, "humidity": hum_s, "rainfall": rain_s,
                  "soil_moisture": soil_s, "wind_speed": wind_s}
        scores["mean"] = float(np.mean(list(scores.values())))
        return scores

    def _drop_risk(self, health01: float, climate: Dict[str, Any], climate_mean: float) -> str:
        """Flower/bud drop risk derived from real bud-health + climate inputs."""
        level = 0  # 0 = Low, 1 = Moderate, 2 = High
        if health01 >= 0.75:
            level = 0
        elif health01 >= 0.55:
            level = 1
        else:
            level = 2

        rain = float(climate.get("rainfall", 2.0))
        temp = float(climate.get("temperature", 29.0))
        if rain > 30.0 or temp < 18.0 or temp > 40.0:
            level += 1
        if climate_mean < 0.6:
            level += 1
        level = min(level, 2)
        return ["Low", "Moderate", "High"][level]

    def _rule_based_prediction(
        self,
        bud_health_score: float,
        climate: Dict[str, Any],
        variety: str,
        plot_acres: float,
    ) -> Dict[str, Any]:
        """
        Yield range computed from REAL inputs. Every number below is a deterministic
        function of budHealth / climate / variety / plotAcres — no fixed output
        constants, no randomness. Disclosed via trained:false + method.
        """
        BASE_YIELD = 5.0  # t/acre reference yield for the reference variety under optimal conditions
        v_factor = self.variety_factor(variety)

        health01 = min(max(float(bud_health_score), 0.0), 100.0) / 100.0
        scores = self._climate_scores(climate)
        climate_mean = scores["mean"]

        health_mult = 0.70 + 0.30 * health01      # [0.70, 1.00]
        climate_mult = 0.55 + 0.45 * climate_mean  # [0.55, 1.00]

        avg = BASE_YIELD * v_factor * health_mult * climate_mult
        # Range width reflects actual uncertainty drivers: unhealthy buds & bad climate
        spread = 0.30 + 0.60 * (1.0 - health01) + 0.30 * (1.0 - climate_mean)

        avg_r = round(avg, 1)
        min_r = round(max(0.5, avg - spread), 1)
        max_r = round(avg + spread, 1)
        avg_r = min(max(avg_r, min_r), max_r)

        return {
            "success": True,
            "isDemo": False,
            "trained": False,
            "method": "rule_based_pending_yield_dataset",
            "modelVersion": self.rule_version,
            "expectedYieldMin": min_r,
            "expectedYieldMax": max_r,
            "expectedYieldAverage": avg_r,
            "yieldUnit": "tonnes / acre",
            "totalPlotExpectedMin": round(min_r * plot_acres, 1),
            "totalPlotExpectedMax": round(max_r * plot_acres, 1),
            "totalPlotUnit": "tonnes total",
            "dropRisk": self._drop_risk(health01, climate, climate_mean),
        }

    def _regressor_prediction(
        self,
        fused: np.ndarray,
        variety: str,
        plot_acres: float,
        bud_health_score: float,
        climate: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """Yield from the REAL trained regressor, or None on any failure."""
        try:
            features_2d = fused.reshape(1, -1)
            if self.scaler is not None:
                features_2d = self.scaler.transform(features_2d)
            predicted = float(self.regressor.predict(features_2d)[0])
            predicted = round(min(max(predicted, 1.0), 12.0), 1)

            spread = max(0.2, 0.05 * predicted)
            avg = predicted
            min_r = round(max(0.5, avg - spread), 1)
            max_r = round(avg + spread, 1)
            avg_r = min(max(avg, min_r), max_r)

            scores = self._climate_scores(climate)
            health01 = min(max(float(bud_health_score), 0.0), 100.0) / 100.0

            return {
                "success": True,
                "isDemo": False,
                "trained": True,
                "method": "regressor",
                "modelVersion": self.regressor_version,
                "expectedYieldMin": min_r,
                "expectedYieldMax": max_r,
                "expectedYieldAverage": round(avg_r, 1),
                "yieldUnit": "tonnes / acre",
                "totalPlotExpectedMin": round(min_r * plot_acres, 1),
                "totalPlotExpectedMax": round(max_r * plot_acres, 1),
                "totalPlotUnit": "tonnes total",
                "dropRisk": self._drop_risk(health01, climate, scores["mean"]),
            }
        except Exception as e:
            print(f"[Regression Error] {e}")
            return None

    # ------------------------------------------------------------------
    def predict_yield(
        self,
        bud_health_score: float,
        climate: Dict[str, Any],
        variety: str = "Alphonso",
        cnn_features: Optional[List[float]] = None,
        plot_acres: float = 2.5
    ) -> Dict[str, Any]:
        """
        Predict yield (tonnes/acre and total plot tonnage) via feature fusion.
        Returns the flattened CONTRACT.md §2 shape.
        """
        # 1. Real trained regressor (never synthetic)
        if self.regressor is not None:
            climate_vec = self.normalize_climate_vector(climate)
            fused = self.fuse_features(cnn_features or [], climate_vec, self.variety_factor(variety))
            result = self._regressor_prediction(fused, variety, plot_acres,
                                                bud_health_score, climate)
            if result is not None:
                return result
            print("[FeatureFusion] Regressor prediction failed -> falling back to rule-based path.")

        # 2. Rule-based path (current default until a numeric-yield dataset exists)
        return self._rule_based_prediction(bud_health_score, climate, variety, plot_acres)
