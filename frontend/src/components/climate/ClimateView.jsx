import React, { useState } from 'react';
import { 
  CloudSun, 
  Thermometer, 
  Droplets, 
  CloudRain, 
  Wind, 
  Sun, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Compass
} from 'lucide-react';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend,
  AreaChart,
  Area 
} from 'recharts';
import { FORECAST_15_DAYS, CURRENT_WEATHER } from '../../services/mockClimateService';

export default function ClimateView({ weather = CURRENT_WEATHER, forecast = FORECAST_15_DAYS, onNavigateToYield }) {
  const [selectedMetric, setSelectedMetric] = useState('ALL'); // 'ALL', 'TEMP', 'RAIN', 'HUMIDITY'

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sky-800 uppercase tracking-wider mb-1">
            <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900">{weather.isDemo === false ? 'Live Weather Data' : 'Demo Data'}</span>
            <span className="text-slate-400">•</span>
            <span>Micro-Climate Station Feed</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
            Climate & 15-Day Weather Outlook
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Weather parameters correlated with mango flower bud retention and yield potential.
          </p>
        </div>

        <button
          onClick={onNavigateToYield}
          className="bg-[#155e34] hover:bg-[#124d2b] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer self-start md:self-auto"
        >
          <span>Correlate with Yield</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Current Real-time Micro-Climate Metrics (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Temperature */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Temperature</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-display">
            {weather.temperature}°C
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Optimal for anthesis (26–33°C)
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Relative Humidity</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-display">
            {weather.humidity}%
          </div>
          <div className="text-xs text-amber-700 font-semibold mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Morning dew increases mildew risk
          </div>
        </div>

        {/* Rainfall */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Rainfall</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CloudRain className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-display">
            {weather.rainfall} mm
          </div>
          <div className="text-xs text-slate-500 font-semibold mt-1">
            Current Level: <span className="text-emerald-700 font-bold">Low (Safe)</span>
          </div>
        </div>

        {/* Wind Speed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Wind Speed</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Wind className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-display">
            {weather.windSpeed} km/h
          </div>
          <div className="text-xs text-slate-500 font-semibold mt-1">
            Direction: <span className="text-slate-800 font-bold">{weather.windDirection || 'WSW'} (Gentle)</span>
          </div>
        </div>
      </div>

      {/* Main 15-Day Forecast Chart Section */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base md:text-lg text-slate-900 font-display">
              15-Day Agronomic Weather Outlook
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Daily temperature max/min, rain volume (mm), and morning relative humidity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">View:</span>
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button 
                onClick={() => setSelectedMetric('ALL')}
                className={`px-3 py-1 rounded-lg transition-colors ${selectedMetric === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'}`}
              >
                Combined
              </button>
              <button 
                onClick={() => setSelectedMetric('TEMP')}
                className={`px-3 py-1 rounded-lg transition-colors ${selectedMetric === 'TEMP' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'}`}
              >
                Temp
              </button>
              <button 
                onClick={() => setSelectedMetric('RAIN')}
                className={`px-3 py-1 rounded-lg transition-colors ${selectedMetric === 'RAIN' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'}`}
              >
                Rain
              </button>
            </div>
          </div>
        </div>

        {/* Large Forecast Chart */}
        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecast} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis yAxisId="left" domain={[0, 42]} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(val, name) => {
                  if (name === 'temp') return [`${val}°C`, 'Max Temp'];
                  if (name === 'tempMin') return [`${val}°C`, 'Min Temp'];
                  if (name === 'rain') return [`${val} mm`, 'Rain Volume'];
                  if (name === 'humidity') return [`${val}%`, 'Humidity'];
                  return [val, name];
                }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }} 
              />
              <Bar yAxisId="left" dataKey="rain" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={14} name="Rainfall (mm)" />
              <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 3, fill: '#ea580c' }} name="Max Temp (°C)" />
              <Line yAxisId="left" type="monotone" dataKey="tempMin" stroke="#f97316" strokeDasharray="3 3" strokeWidth={1.5} dot={false} name="Min Temp (°C)" />
              <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#16a34a" strokeWidth={2} dot={{ r: 2.5, fill: '#16a34a' }} name="Humidity (%)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 15-Day Grid Summary Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2 pt-2 border-t border-slate-100">
          {forecast.slice(0, 8).map((day, i) => (
            <div key={i} className={`p-2.5 rounded-xl border text-center text-xs ${
              day.risk === 'High' 
                ? 'bg-rose-50/60 border-rose-200' 
                : day.risk === 'Moderate' 
                ? 'bg-amber-50/60 border-amber-200' 
                : 'bg-slate-50 border-slate-200/60'
            }`}>
              <div className="font-bold text-slate-800 text-[11px]">{day.day}</div>
              <div className="text-xs font-extrabold text-slate-900 my-1">{day.temp}° / {day.tempMin}°</div>
              <div className="text-[10px] text-blue-600 font-bold">{day.rain} mm rain</div>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded mt-1 inline-block ${
                day.risk === 'High' ? 'bg-rose-100 text-rose-800' : day.risk === 'Moderate' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {day.risk}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Interpretation Section: Flowering Climate Status */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-display">
                Flowering Climate Status
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                Agronomic Interpretation for Mango Bud Retention
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
            Favorable Overall
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: Temperature Suitability */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Thermometer className="w-4 h-4 text-orange-600" />
              <span>Temperature Suitability</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Consistently within the 29°C – 34°C bracket. Ideal for pollen tube growth and pollinator foraging efficiency.
            </p>
          </div>

          {/* Box 2: Rainfall Variance & Flower Drop */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Rainfall Spike Warnings</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Showers forecasted on 27 Aug & 01 Sep may wash off pollen grains. Apply prophylactic sulphur fungicide 24h prior.
            </p>
          </div>

          {/* Box 3: Vapor Pressure Deficit */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Droplets className="w-4 h-4 text-blue-600" />
              <span>Humidity & Powdery Mildew</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Morning relative humidity above 70% accelerates fungal spore incubation in dense shaded canopies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
