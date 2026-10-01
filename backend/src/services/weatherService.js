import mongoose from 'mongoose';
import { Weather } from '../models/Weather.js';
import { getWeatherProvider } from './weatherProviders.js';
import {
  DEFAULT_CURRENT_WEATHER,
  DEFAULT_FORECAST_15_DAYS,
  DEFAULT_CLIMATE_SUMMARY
} from './weatherDefaults.js';

// Re-exported for backwards compatibility (seedService imports these from here).
export { DEFAULT_CURRENT_WEATHER, DEFAULT_FORECAST_15_DAYS };

const dbReady = () => mongoose.connection.readyState === 1;

export const weatherService = {
  /**
   * Current weather.
   * Order: live provider (when WEATHER_PROVIDER=openmeteo) -> stored station
   * doc -> static defaults. Anything that is not live data is flagged
   * `isDemo: true` so it is never presented as real telemetry.
   */
  getCurrentWeather: async (farmId = 'farm-1') => {
    const provider = getWeatherProvider();
    if (provider.isLive) {
      try {
        return await provider.getCurrent(farmId);
      } catch (err) {
        console.warn(`[weatherService] Live provider "${provider.name}" failed (${err.message}). Falling back to demo data (isDemo: true).`);
      }
    }

    if (dbReady()) {
      try {
        const doc = await Weather.findOne({ farmId }).lean();
        if (doc) {
          return {
            temperature: doc.temperature,
            temperatureUnit: doc.temperatureUnit || '°C',
            condition: doc.condition,
            humidity: doc.humidity,
            humidityUnit: doc.humidityUnit || '%',
            rainfall: doc.rainfall,
            rainfallUnit: doc.rainfallUnit || 'mm',
            rainfallLevel: doc.rainfallLevel,
            windSpeed: doc.windSpeed,
            windSpeedUnit: doc.windSpeedUnit || 'km/h',
            windDirection: doc.windDirection,
            solarRadiation: doc.solarRadiation,
            vaporPressureDeficit: doc.vaporPressureDeficit,
            soilMoisture: doc.soilMoisture,
            statusText: doc.statusText,
            location: doc.location,
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : DEFAULT_CURRENT_WEATHER.updatedAt,
            isDemo: true,
            source: 'stored-demo'
          };
        }
      } catch (err) {
        console.warn('[weatherService] DB read failed, using fallback:', err.message);
      }
    }
    return { ...DEFAULT_CURRENT_WEATHER, isDemo: true, source: 'fallback' };
  },

  /**
   * 15-day forecast. EVERY entry carries `isDemo` — static/stored entries are
   * flagged true, live provider entries false (contract §3).
   */
  get15DayForecast: async (farmId = 'farm-1') => {
    const provider = getWeatherProvider();
    if (provider.isLive) {
      try {
        return await provider.getForecast(farmId);
      } catch (err) {
        console.warn(`[weatherService] Live forecast failed (${err.message}). Falling back to demo data (isDemo: true).`);
      }
    }

    if (dbReady()) {
      try {
        const doc = await Weather.findOne({ farmId }).lean();
        if (doc && doc.forecast && doc.forecast.length > 0) {
          // Stored forecast was seeded from demo data — flag every entry.
          return doc.forecast.map((entry) => ({ ...entry, isDemo: true }));
        }
      } catch (err) {
        console.warn('[weatherService] DB read forecast failed, using fallback:', err.message);
      }
    }
    return DEFAULT_FORECAST_15_DAYS.map((entry) => ({ ...entry, isDemo: true }));
  },

  /** Flower-drop climate summary — live-derived when possible, else flagged demo. */
  getClimateSummary: async (farmId = 'farm-1') => {
    const provider = getWeatherProvider();
    if (provider.isLive) {
      try {
        return await provider.getSummary(farmId);
      } catch (err) {
        console.warn(`[weatherService] Live summary failed (${err.message}). Falling back to demo data (isDemo: true).`);
      }
    }

    if (dbReady()) {
      try {
        const doc = await Weather.findOne({ farmId }).lean();
        if (doc && doc.summary) {
          return { ...doc.summary, isDemo: true };
        }
      } catch (err) {
        console.warn('[weatherService] DB read summary failed, using fallback:', err.message);
      }
    }
    return { ...DEFAULT_CLIMATE_SUMMARY, isDemo: true };
  }
};
