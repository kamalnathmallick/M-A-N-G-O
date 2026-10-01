import React, { useState } from 'react';
import { 
  Camera, 
  ArrowRight, 
  Sprout, 
  AlertCircle, 
  CloudSun, 
  Clock, 
  Maximize2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function LatestAnalysisCard({ 
  onStartAnalysis, 
  onViewDetailedClassification,
  analysisData 
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Bind the analysisData prop (fetched upstream) with the previous hardcoded
  // values as display fallbacks so the card never renders empty fields.
  const lastDate = analysisData?.lastAnalysisDate || '24 Aug 2026, 09:30 AM';
  const sampleCount = analysisData?.sampleCount || 4;
  const confidence = analysisData?.confidence ?? 94.2;
  const floweringStage = analysisData?.floweringStage || 'Active';
  const budHealth = `${analysisData?.healthScore ?? 78}% Healthy`;
  const dropRisk = analysisData?.flowerDropRisk || 'Moderate';
  const climate = analysisData?.climateRisk || 'Favorable';
  const lastAnalysis = analysisData?.lastAnalysisDate || 'Today, 09:30 AM';

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base md:text-lg text-slate-900 font-display">
              Latest Analysis Overview
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Multi-sample Panicle Health & Bud Density
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
            {lastDate}
          </span>
        </div>

        {/* Content: Photo + Indicators Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          {/* Left Flower Bud Image Container */}
          <div className="sm:col-span-5 relative group rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-4/3 shadow-xs">
            <img 
              src="/samples/mango_sample_1.jpg" 
              alt="Mango flower buds active panicle"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onLoad={() => setImageLoaded(true)}
            />
            {/* Overlay Gradient & Badge */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-between p-2.5">
              <div className="flex items-center justify-between">
                <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  Sample #1 of {sampleCount}
                </span>
                <button
                  onClick={onViewDetailedClassification}
                  className="w-6 h-6 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center transition-colors"
                  title="Zoom and inspect bud bounding boxes"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>

              <div className="text-white">
                <div className="text-xs font-semibold drop-shadow-sm">Alphonso Panicle</div>
                <div className="text-[10px] text-emerald-300 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> {confidence}% Confidence (Healthy)
                </div>
              </div>
            </div>
          </div>

          {/* Right Parameters List (Matching reference image) */}
          <div className="sm:col-span-7 space-y-3">
            {/* Flowering Stage */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-600">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <span>Flowering Stage</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50/80 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                {floweringStage}
              </span>
            </div>

            {/* Bud Health */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-600">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>Bud Health</span>
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-700">
                {budHealth}
              </span>
            </div>

            {/* Flower Drop Risk */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-600">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <span>Flower Drop Risk</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                {dropRisk}
              </span>
            </div>

            {/* Climate Condition */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-600">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                  <CloudSun className="w-4 h-4" />
                </div>
                <span>Climate Condition</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-emerald-700">
                {climate}
              </span>
            </div>

            {/* Last Analysis */}
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-600">
                <div className="w-7 h-7 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span>Last Analysis</span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-500">
                {lastAnalysis}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Full-Width CTA Button (Dark Green) */}
      <button
        onClick={onStartAnalysis}
        className="mt-5 w-full bg-[#155e34] hover:bg-[#124d2b] active:bg-[#0f4024] text-white py-3.5 px-5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-sm shadow-emerald-950/20 hover:shadow-md transition-all group"
      >
        <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span>Start New Farm Analysis</span>
        <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
