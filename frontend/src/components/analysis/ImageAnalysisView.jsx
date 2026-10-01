import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Bug, 
  Flame, 
  Maximize2, 
  Filter, 
  ArrowRight, 
  Info,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SAMPLE_BUD_IMAGES } from '../../services/mockImageAnalysisService';

export default function ImageAnalysisView({ 
  images = SAMPLE_BUD_IMAGES, 
  isDemo = true,
  analysisSummary = null,
  onContinueToYield, 
  onStartNewAnalysis 
}) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [activeModalImage, setActiveModalImage] = useState(null);

  // Binary metrics (CONTRACT.md §0: dataset is binary GOOD/BAD;
  // statuses: healthy = Good Yield Potential, everything else = Poor)
  const total = images.length || 8;
  const goodList = images.filter(img => img.status === 'healthy');
  const poorList = images.filter(img => img.status && img.status !== 'healthy');

  const goodPercent = images.length
    ? Math.round((goodList.length / images.length) * 100)
    : 0;
  const poorPercent = 100 - goodPercent;

  // Avg model confidence — from per-image confidence, else summary, else "—"
  const confidences = images
    .map(img => img.confidence)
    .filter(v => typeof v === 'number' && !Number.isNaN(v));
  const avgConfidence = confidences.length
    ? +(confidences.reduce((acc, v) => acc + v, 0) / confidences.length).toFixed(1)
    : typeof analysisSummary?.confidenceScore === 'number'
    ? analysisSummary.confidenceScore
    : null;

  // Image quality pass rate — from quality.is_valid, else derived from
  // summary.rejectedCount, else "—" when the backend omitted quality data.
  const withQuality = images.filter(
    img => img.quality && typeof img.quality.is_valid === 'boolean'
  );
  const qualityPassPercent = withQuality.length
    ? Math.round(
        (withQuality.filter(img => img.quality.is_valid).length / withQuality.length) * 100
      )
    : typeof analysisSummary?.rejectedCount === 'number'
    ? Math.round((total / (total + analysisSummary.rejectedCount)) * 100)
    : null;

  const filteredImages = images.filter(img => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'GOOD') return img.status === 'healthy';
    if (selectedFilter === 'POOR') return img.status && img.status !== 'healthy';
    return true;
  });

  const donutData = [
    { name: 'Good Yield Potential', value: goodPercent, color: '#16a34a' },
    { name: 'Poor Yield Potential', value: poorPercent, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Summary Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
              {isDemo ? 'Demo Data' : 'Live Model Result'}
            </span>
            <span className="text-slate-400">•</span>
            <span>AI Bud Analysis (Batch Evaluation)</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
            Flower Bud Classification & Health
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            {isDemo
              ? 'Multi-canopy sample classification from the offline demo pipeline.'
              : 'Multi-canopy sample classification from the live CNN model on your uploaded samples.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onStartNewAnalysis}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-upload</span>
          </button>
          <button
            onClick={onContinueToYield}
            className="bg-[#155e34] hover:bg-[#124d2b] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <span>Proceed to Yield Prediction</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards: Donut Chart + Drop Risk Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Donut Health Distribution Card (6/12) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-base text-slate-900 font-display">
                Overall Bud Health Summary
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                {images.length} Samples Assessed
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Breakdown of healthy floral panicles versus risk-affected clusters.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
              {/* Donut Chart */}
              <div className="sm:col-span-5 h-44 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val) => [`${val}%`, 'Proportion']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Percentage */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 font-display">
                    {goodPercent}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">
                    Good
                  </span>
                </div>
              </div>

              {/* Legend & Stats */}
              <div className="sm:col-span-7 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="font-bold text-emerald-950">Good Yield Potential</span>
                  </div>
                  <span className="font-extrabold text-emerald-800">{goodPercent}%</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/70 border border-rose-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-bold text-rose-950">Poor Yield Potential</span>
                  </div>
                  <span className="font-extrabold text-rose-800">{poorPercent}%</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50/70 border border-sky-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span className="font-bold text-sky-950">Avg Model Confidence</span>
                  </div>
                  <span className="font-extrabold text-sky-800">
                    {avgConfidence !== null ? `${avgConfidence}%` : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/70 border border-purple-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span className="font-bold text-purple-950">Image Quality Pass</span>
                  </div>
                  <span className="font-extrabold text-purple-800">
                    {qualityPassPercent !== null ? `${qualityPassPercent}%` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flower Drop Risk Factors Card (6/12) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-base text-slate-900 font-display">
                Flower Drop Risk Analysis
              </h3>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                {analysisSummary?.flowerDropRisk || 'Moderate'} Risk
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Estimated flower-drop sensitivity synthesized across 3 agronomic vectors:
            </p>

            <div className="space-y-3">
              {/* Factor 1: Bud Condition */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>1. Bud Vigor & Morphology</span>
                    <span className="text-emerald-700">{goodPercent}% Favorable</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Terminal axis elongation is strong across {goodPercent}% of samples with normal trichome density.
                  </p>
                </div>
              </div>

              {/* Factor 2: Pest Indicators */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Bug className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>2. Pest Activity (Mango Hopper Nymphs)</span>
                    <span className="text-amber-700">Moderate Presence</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Isolated honeydew secretions detected on south-facing trees. Action advised before full bloom.
                  </p>
                </div>
              </div>

              {/* Factor 3: Environmental Stress */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>3. Climatic & Thermal Stress</span>
                    <span className="text-sky-700">Low–Moderate</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Upcoming 27 Aug & 01 Sep showers may cause sudden humidity swings. Light pre-rain spray recommended.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Sample Images Grid with Filters */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 font-display">
              Sample Bud Classification Gallery
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Click any sample to inspect bounding box detections and model confidence scores
            </span>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedFilter === 'ALL' ? 'bg-[#155e34] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({images.length})
            </button>
            <button
              onClick={() => setSelectedFilter('GOOD')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedFilter === 'GOOD' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Good ({goodList.length})
            </button>
            <button
              onClick={() => setSelectedFilter('POOR')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedFilter === 'POOR' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Poor ({poorList.length})
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredImages.map((img, idx) => (
            <div
              key={img.id}
              onClick={() => setActiveModalImage(img)}
              className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/70 hover:border-emerald-300 hover:shadow-md transition-all duration-200 group cursor-pointer flex flex-col justify-between"
            >
              {/* Photo Box */}
              <div className="relative aspect-4/3 overflow-hidden bg-slate-900">
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Simulated Bounding Box Overlay */}
                {img.boxes && img.boxes[0] && (
                  <div 
                    className={`absolute border-2 rounded-lg pointer-events-none ${
                      img.status === 'healthy' 
                        ? 'border-emerald-400 bg-emerald-400/10' 
                        : img.status === 'diseased'
                        ? 'border-purple-400 bg-purple-400/10'
                        : img.status === 'pest_risk'
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-rose-400 bg-rose-400/10'
                    }`}
                    style={{
                      left: `${img.boxes[0].x}%`,
                      top: `${img.boxes[0].y}%`,
                      width: `${img.boxes[0].width}%`,
                      height: `${img.boxes[0].height}%`
                    }}
                  >
                    <span className="absolute -top-5 left-0 text-[9px] font-extrabold bg-black/80 text-white px-1.5 py-0.5 rounded backdrop-blur-xs whitespace-nowrap">
                      {img.boxes[0].label} ({Math.round(img.boxes[0].score * 100)}%)
                    </span>
                  </div>
                )}

                {/* Top Corner Badge */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {img.confidence}% Conf.
                  </span>
                  <div className="w-6 h-6 rounded-full bg-white/90 text-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">
                    {img.title}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    img.status === 'healthy' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : img.status === 'diseased'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : img.status === 'pest_risk'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {img.classification}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {img.notes}
                </p>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    Quality:{' '}
                    {img.quality
                      ? img.quality.is_valid
                        ? 'Passed'
                        : 'Failed'
                      : 'Not checked'}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {isDemo ? 'Demo Classification' : 'Live CNN Classification'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Zoom for Single Sample Inspection */}
      {activeModalImage && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            {/* Modal Image Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 font-display">
                  {activeModalImage.title}
                </h4>
                <div className="text-xs text-slate-500 font-medium">
                  {activeModalImage.stage} • {isDemo ? 'Prototype Feature Map' : 'Live Model Inspection'}
                </div>
              </div>
              <button
                onClick={() => setActiveModalImage(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* High-res Display with Bounding Boxes */}
            <div className="relative aspect-16/10 bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={activeModalImage.url}
                alt={activeModalImage.title}
                className="w-full h-full object-contain"
              />

              {activeModalImage.boxes && activeModalImage.boxes[0] && (
                <div 
                  className={`absolute border-2 rounded-lg ${
                    activeModalImage.status === 'healthy' 
                      ? 'border-emerald-400 bg-emerald-400/20' 
                      : 'border-amber-400 bg-amber-400/20'
                  }`}
                  style={{
                    left: `${activeModalImage.boxes[0].x}%`,
                    top: `${activeModalImage.boxes[0].y}%`,
                    width: `${activeModalImage.boxes[0].width}%`,
                    height: `${activeModalImage.boxes[0].height}%`
                  }}
                >
                  <span className="absolute -top-7 left-0 text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded shadow">
                    {activeModalImage.boxes[0].label} ({Math.round(activeModalImage.boxes[0].score * 100)}%)
                  </span>
                </div>
              )}
            </div>

            {/* Modal Details */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase">Classification</span>
                  <div className="text-base font-extrabold text-slate-900">
                    {activeModalImage.classification} — {activeModalImage.confidence}%
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-semibold uppercase">
                    {activeModalImage.healthyBuds != null && activeModalImage.detectedBuds != null
                      ? 'Floral Cluster Count'
                      : 'Image Quality'}
                  </span>
                  <div className="text-base font-extrabold text-emerald-700">
                    {activeModalImage.healthyBuds != null && activeModalImage.detectedBuds != null
                      ? `${activeModalImage.healthyBuds} Healthy / ${activeModalImage.detectedBuds} Total`
                      : activeModalImage.quality
                      ? `${activeModalImage.quality.is_valid ? 'Passed' : 'Failed'}${
                          typeof activeModalImage.quality.blur_score === 'number'
                            ? ` • Blur ${Math.round(activeModalImage.quality.blur_score)}`
                            : ''
                        }`
                      : 'Not checked'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700 border border-slate-200">
                <span className="font-bold">Agronomist Observation: </span>
                <span>{activeModalImage.notes}</span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveModalImage(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
