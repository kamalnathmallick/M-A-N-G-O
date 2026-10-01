/**
 * Weather provider interface.
 *
 * A provider exposes three async methods:
 *   - getCurrent(farmId)  -> CURRENT_WEATHER-shaped object (+ isDemo flag)
 *   - getForecast(farmId) -> 15-entry forecast array (+ isDemo flag per entry)
 *   - getSummary(farmId)  -> climate summary object (+ isDemo flag)
 *
 * Providers:
 *   - 'mock'      : static demo data. ALWAYS served with isDemo: true.
 *   - 'openmeteo' : live, keyless Open-Meteo HTTP API (https://open-meteo.com).
 *                   Served with isDemo: false on success; the caller falls back
 *                   to demo data (flagged isDemo: true) on any failure.
 *
 * Selected with env WEATHER_PROVIDER=mock|openmeteo (see src/config/env.js).
 */
import axios from 'axios';
import { env } from '../config/env.js';
import { DEFAULT_CURRENT_WEATHER, DEFAULT_FORECAST_15_DAYS, DEFAULT_CLIMATE_SUMMARY } from './weatherDefaults.js';

const OPENMETEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 6000;

/** WMO weather interpretation codes -> human readable condition. */
const WMO_CODES = {
  0: 'Clear',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime Fog',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Dense Drizzle',
  56: 'Freezing Drizzle',
  57: 'Freezing Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  66: 'Freezing Rain',
  67: 'Freezing Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  77: 'Snow Grains',
  80: 'Rain Showers',
  81: 'Rain Showers',
  82: 'Violent Rain Showers',
  85: 'Snow Showers',
  86: 'Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Hail',
  99: 'Thunderstorm with Hail'
};

/** Degrees -> 16-point compass label. */
const degreesToCompass = (deg) => {
  if (deg === null || deg === undefined || Number.isNaN(deg)) return '—';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round((deg % 360) / 22.5) % 16];
};

/** Saturation vapour pressure (kPa) — real formula, used to derive VPD. */
const saturationVapourPressure = (tempC) => 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));

/** Day-level risk classification derived from rain probability and amount. */
const deriveRisk = (rainProb, rainMm) => {
  if (rainProb >= 70 || rainMm >= 15) return 'High';
  if (rainProb >= 40 || rainMm >= 5) return 'Moderate';
  return 'Low';
};

const buildOpenMeteoParams = (extra = {}) => ({
  latitude: env.OPENMETEO_LATITUDE,
  longitude: env.OPENMETEO_LONGITUDE,
  timezone: 'auto',
  forecast_days: 15,
  ...extra
});

export const weatherProviders = {
  // -------------------------------------------------------------------------
  // Mock provider — static demo data, always flagged isDemo: true.
  // -------------------------------------------------------------------------
  mock: {
    name: 'mock',
    isLive: false,
    getCurrent: async () => ({ ...DEFAULT_CURRENT_WEATHER, isDemo: true, source: 'mock' }),
    getForecast: async () => DEFAULT_FORECAST_15_DAYS.map((d) => ({ ...d, isDemo: true })),
    getSummary: async () => ({ ...DEFAULT_CLIMATE_SUMMARY, isDemo: true })
  },

  // -------------------------------------------------------------------------
  // Open-Meteo provider — live, keyless HTTP API via axios.
  // Throws on any failure so the caller can fall back to flagged demo data.
  // -------------------------------------------------------------------------
  openmeteo: {
    name: 'openmeteo',
    isLive: true,

    getCurrent: async () => {
      const { data } = await axios.get(OPENMETEO_BASE, {
        params: buildOpenMeteoParams({
          current: 'temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,wind_direction_10m,weather_code'
        }),
        timeout: REQUEST_TIMEOUT_MS
      });
      const cur = data.current || {};
      const units = data.current_units || {};
      const temperature = cur.temperature_2m ?? null;
      const humidity = cur.relative_humidity_2m ?? null;
      const vpd = temperature !== null && humidity !== null
        ? `${(saturationVapourPressure(temperature) * (1 - humidity / 100)).toFixed(1)} kPa`
        : '—';

      return {
        temperature,
        temperatureUnit: units.temperature_2m || '°C',
        condition: WMO_CODES[cur.weather_code] ?? 'Unknown',
        humidity,
        humidityUnit: units.relative_humidity_2m || '%',
        rainfall: cur.precipitation ?? cur.rain ?? 0,
        rainfallUnit: units.precipitation || 'mm',
        rainfallLevel: (cur.precipitation ?? 0) >= 10 ? 'High' : (cur.precipitation ?? 0) >= 2 ? 'Moderate' : 'Low',
        windSpeed: cur.wind_speed_10m ?? null,
        windSpeedUnit: units.wind_speed_10m || 'km/h',
        windDirection: degreesToCompass(cur.wind_direction_10m),
        solarRadiation: 'Not available from this source',
        vaporPressureDeficit: vpd,
        soilMoisture: 'Not available from this source',
        statusText: 'Live conditions (Open-Meteo)',
        location: env.OPENMETEO_LOCATION_NAME,
        updatedAt: new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        isDemo: false,
        source: 'openmeteo'
      };
    },

    getForecast: async () => {
      const { data } = await axios.get(OPENMETEO_BASE, {
        params: buildOpenMeteoParams({
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
          hourly: 'relative_humidity_2m'
        }),
        timeout: REQUEST_TIMEOUT_MS
      });

      const daily = data.daily || {};
      const times = daily.time || [];
      const hourlyTimes = data.hourly?.time || [];
      const hourlyHumidity = data.hourly?.relative_humidity_2m || [];

      // Average hourly humidity per calendar day (real aggregation, no guessing).
      const humidityByDate = {};
      hourlyTimes.forEach((t, i) => {
        const date = String(t).slice(0, 10);
        const value = hourlyHumidity[i];
        if (value === null || value === undefined) return;
        if (!humidityByDate[date]) humidityByDate[date] = { sum: 0, count: 0 };
        humidityByDate[date].sum += value;
        humidityByDate[date].count += 1;
      });

      const forecast = times.map((dateStr, i) => {
        const rainProb = daily.precipitation_probability_max?.[i] ?? 0;
        const rain = daily.precipitation_sum?.[i] ?? 0;
        const humidityBucket = humidityByDate[dateStr];
        const humidity = humidityBucket ? Math.round(humidityBucket.sum / humidityBucket.count) : null;
        const d = new Date(`${dateStr}T00:00:00`);
        return {
          day: `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-US', { month: 'short' })}`,
          date: dateStr,
          temp: daily.temperature_2m_max?.[i] ?? null,
          tempMin: daily.temperature_2m_min?.[i] ?? null,
          rain,
          rainProb,
          humidity,
          risk: deriveRisk(rainProb, rain),
          condition: WMO_CODES[daily.weather_code?.[i]] ?? 'Unknown',
          isDemo: false
        };
      });

      if (forecast.length === 0) {
        throw new Error('Open-Meteo returned an empty daily forecast');
      }
      return forecast;
    },

    getSummary: async () => {
      const current = await weatherProviders.openmeteo.getCurrent();
      const forecast = await weatherProviders.openmeteo.getForecast();

      const totalRain = forecast.reduce((acc, d) => acc + (d.rain || 0), 0);
      const maxRainProb = Math.max(...forecast.map((d) => d.rainProb || 0));
      const hotDays = forecast.filter((d) => (d.temp ?? 0) >= 34).length;
      const maxTemp = Math.max(...forecast.map((d) => d.temp ?? 0));
      const minTemp = Math.min(...forecast.map((d) => d.temp ?? 0));
      const heavyRainDays = forecast.filter((d) => d.risk === 'High').map((d) => d.day);

      return {
        isDemo: false,
        source: 'openmeteo',
        currentCondition: current.condition,
        climateRiskLevel: maxRainProb >= 70 ? 'High' : maxRainProb >= 40 ? 'Moderate' : 'Low',
        floweringStatusNote: `Live 15-day outlook: ${totalRain.toFixed(1)} mm total rainfall expected with a peak daily rain probability of ${maxRainProb}%.`,
        temperatureSuitability: `Forecast range ${minTemp}°C – ${maxTemp}°C${hotDays > 0 ? `; ${hotDays} day(s) at or above 34°C may increase flower-drop stress` : '— within the comfortable flowering range'}.`,
        humidityAlert: `Current relative humidity ${current.humidity}%.`,
        rainfallImpact: heavyRainDays.length > 0
          ? `High-impact rain day(s): ${heavyRainDays.join(', ')}. Plan canopy aeration and spraying around those windows.`
          : 'No high-impact rain days detected in the 15-day window.'
      };
    }
  }
};

export const getWeatherProvider = () =>
  env.WEATHER_PROVIDER === 'openmeteo' ? weatherProviders.openmeteo : weatherProviders.mock;
