/**
 * Static demo/default weather data.
 *
 * Lives in its own module so both `weatherService.js` and the weather providers
 * can import it without creating an import cycle.
 *
 * EVERYTHING in this file is demo/fallback data and must always be served with
 * `isDemo: true` — it must never be presented to clients as live telemetry.
 */

export const DEFAULT_CURRENT_WEATHER = {
  temperature: 29,
  temperatureUnit: '°C',
  condition: 'Partly Cloudy',
  humidity: 68,
  humidityUnit: '%',
  rainfall: 2,
  rainfallUnit: 'mm',
  rainfallLevel: 'Low',
  windSpeed: 12,
  windSpeedUnit: 'km/h',
  windDirection: 'WSW',
  solarRadiation: '21.4 MJ/m²',
  vaporPressureDeficit: '1.3 kPa',
  soilMoisture: '34%',
  statusText: 'Favorable Conditions',
  location: 'Farm Field (Plot A Station)',
  updatedAt: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
};

export const DEFAULT_FORECAST_15_DAYS = [
  { day: '24 Aug', date: '2026-08-24', temp: 31, tempMin: 22, rain: 14, rainProb: 65, humidity: 72, risk: 'Moderate', condition: 'Scattered Showers' },
  { day: '25 Aug', date: '2026-08-25', temp: 30, tempMin: 21, rain: 3, rainProb: 25, humidity: 74, risk: 'Low', condition: 'Partly Cloudy' },
  { day: '26 Aug', date: '2026-08-26', temp: 32, tempMin: 23, rain: 2, rainProb: 15, humidity: 70, risk: 'Low', condition: 'Sunny' },
  { day: '27 Aug', date: '2026-08-27', temp: 31, tempMin: 22, rain: 16, rainProb: 70, humidity: 75, risk: 'Moderate', condition: 'Thunderstorms' },
  { day: '28 Aug', date: '2026-08-28', temp: 29, tempMin: 21, rain: 7, rainProb: 40, humidity: 72, risk: 'Low', condition: 'Cloudy' },
  { day: '29 Aug', date: '2026-08-29', temp: 31, tempMin: 22, rain: 2, rainProb: 10, humidity: 68, risk: 'Low', condition: 'Clear' },
  { day: '30 Aug', date: '2026-08-30', temp: 30, tempMin: 21, rain: 5, rainProb: 30, humidity: 73, risk: 'Low', condition: 'Partly Cloudy' },
  { day: '31 Aug', date: '2026-08-31', temp: 33, tempMin: 24, rain: 4, rainProb: 20, humidity: 71, risk: 'Low', condition: 'Sunny' },
  { day: '01 Sep', date: '2026-09-01', temp: 34, tempMin: 24, rain: 17, rainProb: 75, humidity: 76, risk: 'High', condition: 'Heavy Rain Risk' },
  { day: '02 Sep', date: '2026-09-02', temp: 31, tempMin: 22, rain: 1, rainProb: 10, humidity: 72, risk: 'Low', condition: 'Breezy' },
  { day: '03 Sep', date: '2026-09-03', temp: 33, tempMin: 23, rain: 8, rainProb: 45, humidity: 74, risk: 'Moderate', condition: 'Light Rain' },
  { day: '04 Sep', date: '2026-09-04', temp: 34, tempMin: 24, rain: 1, rainProb: 15, humidity: 69, risk: 'Low', condition: 'Sunny' },
  { day: '05 Sep', date: '2026-09-05', temp: 34, tempMin: 24, rain: 9, rainProb: 50, humidity: 73, risk: 'Moderate', condition: 'Evening Showers' },
  { day: '06 Sep', date: '2026-09-06', temp: 33, tempMin: 23, rain: 3, rainProb: 20, humidity: 70, risk: 'Low', condition: 'Clear' },
  { day: '07 Sep', date: '2026-09-07', temp: 35, tempMin: 25, rain: 2, rainProb: 15, humidity: 68, risk: 'Low', condition: 'Warm & Sunny' }
];

export const DEFAULT_CLIMATE_SUMMARY = {
  isDemo: true,
  currentCondition: 'Favorable',
  climateRiskLevel: 'Low – Moderate',
  floweringStatusNote: 'Generally favorable conditions for flowering. Rainfall variations in the next 7 days may slightly increase flower drop risk.',
  temperatureSuitability: 'Optimal (26°C - 33°C range facilitates efficient anthesis and pollen viability)',
  humidityAlert: 'Morning RH (74%) promotes vegetative dew. Monitor lower canopies for early powdery mildew spores.',
  rainfallImpact: 'Spike predicted on 27 Aug & 01 Sep. Ensure canopy aeration and avoid spraying on rain-heavy mornings.'
};
