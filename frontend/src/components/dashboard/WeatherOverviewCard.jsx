import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  CloudRain, 
  Wind, 
  Info,
  ChevronRight
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
  Legend 
} from 'recharts';

export default function WeatherOverviewCard({ 
  weather, 
  forecast, 
  onViewDetailedClimate 
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between h-full min-w-0">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base md:text-lg text-slate-900 font-display">
              Current Weather
            </h3>
            <Info className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 cursor-pointer" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-400">
            Location: {weather.location || 'Farm Field'}
          </span>
        </div>

        {/* 4 Weather Parameter Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
          {/* Temperature */}
          <div className="bg-orange-50/40 rounded-xl p-2.5 sm:p-3 border border-orange-100/70 flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-100/80 text-orange-600 flex items-center justify-center shrink-0">
              <Thermometer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">Temperature</div>
              <div className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 truncate">
                {weather.temperature}{weather.temperatureUnit}
              </div>
            </div>
          </div>

          {/* Humidity */}
          <div className="bg-blue-50/40 rounded-xl p-2.5 sm:p-3 border border-blue-100/70 flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
              <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">Humidity</div>
              <div className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 truncate">
                {weather.humidity}{weather.humidityUnit}
              </div>
            </div>
          </div>

          {/* Rainfall */}
          <div className="bg-sky-50/40 rounded-xl p-2.5 sm:p-3 border border-sky-100/70 flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-100/80 text-sky-600 flex items-center justify-center shrink-0">
              <CloudRain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">Rainfall</div>
              <div className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 truncate">
                {weather.rainfall} {weather.rainfallUnit}
              </div>
            </div>
          </div>

          {/* Wind Speed */}
          <div className="bg-teal-50/40 rounded-xl p-2.5 sm:p-3 border border-teal-100/70 flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-100/80 text-teal-600 flex items-center justify-center shrink-0">
              <Wind className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">Wind Speed</div>
              <div className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 truncate">
                {weather.windSpeed} {weather.windSpeedUnit}
              </div>
            </div>
          </div>
        </div>

        {/* 15-Day Weather Outlook Section */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-xs sm:text-sm text-slate-900 font-display">
            15-Day Weather Outlook
          </h4>
          <button 
            onClick={onViewDetailedClimate}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Chart Container */}
        <div className="w-full h-44 sm:h-48 pt-1 min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecast} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 8, fill: '#64748b' }} 
                tickLine={false} 
                axisLine={{ stroke: '#e2e8f0' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                yAxisId="left" 
                domain={[0, 40]} 
                tick={{ fontSize: 8, fill: '#64748b' }} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                domain={[0, 120]} 
                tick={{ fontSize: 8, fill: '#64748b' }} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
                  border: '1px solid #e2e8f0', 
                  fontSize: '11px',
                  padding: '8px 12px'
                }}
                formatter={(val, name) => {
                  if (name === 'temp') return [`${val}°C`, 'Temperature'];
                  if (name === 'rain') return [`${val} mm`, 'Rainfall'];
                  if (name === 'humidity') return [`${val}%`, 'Humidity'];
                  return [val, name];
                }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconSize={7}
                wrapperStyle={{ fontSize: '9px', paddingTop: '-10px', paddingBottom: '6px' }}
                formatter={(value) => {
                  if (value === 'temp') return <span className="text-slate-600 font-medium">Temp</span>;
                  if (value === 'rain') return <span className="text-slate-600 font-medium">Rain</span>;
                  if (value === 'humidity') return <span className="text-slate-600 font-medium">Humidity</span>;
                  return value;
                }}
              />
              <Bar 
                yAxisId="left" 
                dataKey="rain" 
                fill="#3b82f6" 
                radius={[2, 2, 0, 0]} 
                barSize={8} 
                name="rain"
              />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="temp" 
                stroke="#ea580c" 
                strokeWidth={2} 
                dot={{ r: 2, fill: '#ea580c' }} 
                name="temp"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="humidity" 
                stroke="#16a34a" 
                strokeWidth={1.5} 
                strokeDasharray="3 2"
                dot={{ r: 1.5, fill: '#16a34a' }} 
                name="humidity"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Info Callout Box */}
      <div className="mt-3 rounded-xl bg-sky-50/70 border border-sky-100 p-2.5 flex items-start gap-2 text-[10px] sm:text-[11px] text-sky-900 leading-snug">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <span>
          Generally favorable conditions for flowering. Rainfall variations in the next 7 days may slightly increase flower drop risk.
        </span>
      </div>
    </div>
  );
}
