import mongoose from 'mongoose';

const forecastDaySchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    date: { type: String, required: true },
    temp: { type: Number, required: true },
    tempMin: { type: Number, required: true },
    rain: { type: Number, required: true },
    rainProb: { type: Number, required: true },
    humidity: { type: Number, required: true },
    risk: { type: String, default: 'Low' },
    condition: { type: String, default: 'Clear' }
  },
  { _id: false }
);

const weatherSchema = new mongoose.Schema(
  {
    farmId: { type: String, default: 'farm-1', index: true },
    location: { type: String, default: 'Farm Field (Plot A Station)' },
    temperature: { type: Number, default: 29 },
    temperatureUnit: { type: String, default: '°C' },
    condition: { type: String, default: 'Partly Cloudy' },
    humidity: { type: Number, default: 68 },
    humidityUnit: { type: String, default: '%' },
    rainfall: { type: Number, default: 2 },
    rainfallUnit: { type: String, default: 'mm' },
    rainfallLevel: { type: String, default: 'Low' },
    windSpeed: { type: Number, default: 12 },
    windSpeedUnit: { type: String, default: 'km/h' },
    windDirection: { type: String, default: 'WSW' },
    solarRadiation: { type: String, default: '21.4 MJ/m²' },
    vaporPressureDeficit: { type: String, default: '1.3 kPa' },
    soilMoisture: { type: String, default: '34%' },
    statusText: { type: String, default: 'Favorable Conditions' },
    // Stored weather is seeded demo data unless a real ingestion source
    // marks it otherwise — never present demo data as live (CONTRACT.md §3).
    isDemo: { type: Boolean, default: true },
    forecast: [forecastDaySchema],
    summary: {
      currentCondition: { type: String, default: 'Favorable' },
      climateRiskLevel: { type: String, default: 'Low – Moderate' },
      floweringStatusNote: { type: String, default: 'Generally favorable conditions for flowering.' },
      temperatureSuitability: { type: String, default: 'Optimal (26°C - 33°C range facilitates efficient anthesis)' },
      humidityAlert: { type: String, default: 'Morning RH promotes vegetative dew.' },
      rainfallImpact: { type: String, default: 'Spikes predicted. Ensure canopy aeration.' }
    }
  },
  {
    timestamps: true
  }
);

export const Weather = mongoose.model('Weather', weatherSchema);
