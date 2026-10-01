import React from 'react';
import { Info, AlertTriangle, CloudSun, Sprout } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subtitle,
  badgeText,
  badgeType = 'default', // 'prototype', 'warning', 'success', 'info'
  type = 'yield', // 'yield', 'bud', 'risk', 'climate'
  sparklineData,
  onClick
}) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>{title}</span>
          <Info className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
        </div>

        {/* Custom Illustrative Visual Icon based on Card Type */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105">
          {type === 'yield' && (
            <div className="w-12 h-12 rounded-2xl bg-amber-50/80 border border-amber-100 flex items-center justify-center">
              <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 5C11.5 5 6 8.5 6 16C6 24.5 13.5 29 16 29C18.5 29 26 24.5 26 16C26 8.5 20.5 5 16 5Z" fill="#F59E0B" />
                <path d="M17.5 5C17.5 3 16 1.8 14.5 2" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
                <path d="M17 5C20.5 3.5 24 4.5 25 7C22 7.5 18.5 7 17 5Z" fill="#16A34A" />
              </svg>
            </div>
          )}

          {type === 'bud' && (
            <div className="w-12 h-12 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22V8" strokeLinecap="round" />
                <path d="M12 8C12 4 14 2 16 2C16 4 14 8 12 8Z" fill="#84CC16" fillOpacity="0.4" />
                <path d="M12 12C9 10 7 11 6 13C8 14 11 13 12 12Z" fill="#84CC16" fillOpacity="0.4" />
                <path d="M12 16C15 14 17 15 18 17C16 18 13 17 12 16Z" fill="#84CC16" fillOpacity="0.4" />
                <circle cx="16" cy="2" r="1.5" fill="#EAB308" />
                <circle cx="6" cy="13" r="1.5" fill="#EAB308" />
                <circle cx="18" cy="17" r="1.5" fill="#EAB308" />
              </svg>
            </div>
          )}

          {type === 'risk' && (
            <div className="w-12 h-12 rounded-2xl bg-amber-50/80 border border-amber-200/70 flex items-center justify-center">
              <div className="w-8 h-8 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>
          )}

          {type === 'climate' && (
            <div className="w-12 h-12 rounded-2xl bg-sky-50/80 border border-sky-100 flex items-center justify-center">
              <CloudSun className="w-7 h-7 text-sky-500" />
            </div>
          )}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-1">
        <div className="text-2xl lg:text-[28px] font-extrabold text-slate-900 tracking-tight font-display flex items-baseline gap-1.5">
          {type === 'risk' ? (
            <span className="text-amber-600">{value}</span>
          ) : type === 'climate' ? (
            <span className="text-slate-800 text-xl lg:text-2xl">{value}</span>
          ) : (
            <span>{value}</span>
          )}
        </div>
        <div className="text-xs text-slate-500 font-medium mt-0.5">
          {subtitle}
        </div>
      </div>

      {/* Visual Indicator / Progress / Sparkline */}
      <div className="mt-4 flex items-center justify-between gap-3">
        {badgeText && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wide ${
            badgeType === 'warning'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : badgeType === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : badgeType === 'info'
              ? 'bg-sky-50 text-sky-800 border-sky-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
          }`}>
            {badgeText}
          </span>
        )}

        {/* Small SVG Sparkline */}
        <div className="w-20 h-5">
          {type === 'yield' && (
            <svg className="w-full h-full stroke-emerald-600" viewBox="0 0 80 20" fill="none">
              <path d="M2 16L18 14L34 17L50 8L66 11L78 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {type === 'bud' && (
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
              <div className="bg-emerald-600 h-full rounded-full w-[78%]" />
            </div>
          )}
          {type === 'risk' && (
            <svg className="w-full h-full stroke-amber-500" viewBox="0 0 80 20" fill="none">
              <path d="M2 10C15 6 25 15 40 10C55 5 65 14 78 8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          {type === 'climate' && (
            <svg className="w-full h-full stroke-sky-500" viewBox="0 0 80 20" fill="none">
              <path d="M2 12C12 8 24 16 36 10C48 4 60 14 78 6" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
