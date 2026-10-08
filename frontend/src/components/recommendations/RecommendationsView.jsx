import React, { useState } from 'react';
import {
  Lightbulb,
  Droplets,
  Bug,
  CloudRain,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Share2,
  Check,
  Printer,
  Filter,
  Leaf,
  Info
} from 'lucide-react';

export default function RecommendationsView({ recommendations = [], overallRisk, onStartNewAnalysis }) {
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [completedTasks, setCompletedTasks] = useState({});
  const [copiedNotification, setCopiedNotification] = useState(false);

  const toggleTaskDone = (id) => {
    setCompletedTasks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Recommendations are loaded in App.jsx via mockRecommendationService
  // .getRecommendations() (GET /recommendations) and passed down.
  const recs = Array.isArray(recommendations) ? recommendations : [];

  const filtered = recs.filter(r => {
    if (filterPriority === 'ALL') return true;
    return r.priority === filterPriority;
  });

  // Priority counts are computed from live data instead of hardcoded numbers.
  const highCount = recs.filter(r => r.priority === 'HIGH').length;
  const mediumCount = recs.filter(r => r.priority === 'MEDIUM').length;
  const lowCount = recs.filter(r => r.priority === 'LOW').length;

  // Overall Farm Risk: prefer a backend value embedded in the recommendations
  // payload; otherwise fall back to the `overallRisk` prop
  // (mockRecommendationService.getOverallFarmRisk() is an EXPLICIT mock
  // fallback — no backend endpoint exists for it in CONTRACT.md §3).
  const normalizeRisk = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return { level: value };
    if (typeof value === 'object') return value;
    return null;
  };
  const riskCarrier = recs.find(r => r && (r.overallRisk || r.farmRisk || r.riskSummary));
  const payloadRisk = normalizeRisk(
    riskCarrier?.overallRisk || riskCarrier?.farmRisk || riskCarrier?.riskSummary
  );
  const risk = payloadRisk || normalizeRisk(overallRisk) || { level: 'Moderate' };
  const riskLevel = risk.level || 'Moderate';
  const riskSummary =
    risk.farmerSummary ||
    (risk.primaryDrivers && risk.primaryDrivers.join(' ')) ||
    'Farm health is good, but upcoming rainfall variations require proactive fungal prophylaxis.';

  const handleShareWhatsApp = () => {
    // Share text is built from the REAL loaded advisories — never a literal
    // 78% / 4.8-5.4 t/acre payload unrelated to this plot.
    const topAction = filtered[0]?.title || recs[0]?.title || 'No active advisories for this plot';
    const text = encodeURIComponent(
      `🌾 *MangoSense Crop Advisory*\n• *Overall Risk:* ${riskLevel}\n• *Top Action:* ${topAction}\n• *Advisories:* ${recs.length}\n• *Generated:* ${new Date().toLocaleDateString()}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">Farmer Advisory</span>
            <span className="text-slate-400">•</span>
            <span>Flowering & Retention Protocol</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
            What Should You Do?
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Prioritized agronomic actions tailored to your current bud health, climate forecast & pest risks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share via WhatsApp</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Overall Farm Risk Summary Banner (As specified in prompt) */}
      <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-amber-900">Overall Farm Risk:</span>
              <span className="text-sm font-extrabold px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-950">
                {riskLevel} Risk
              </span>
            </div>
            <p className="text-xs text-amber-800/90 mt-1">
              {riskSummary}
            </p>
          </div>
        </div>

        <div className="text-xs text-amber-900 font-semibold shrink-0 bg-white/80 px-3 py-1.5 rounded-xl border border-amber-200">
          Completed: {Object.values(completedTasks).filter(Boolean).length} / {recs.length} Actions Done
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase">Filter Priority:</span>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setFilterPriority('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors ${filterPriority === 'ALL' ? 'bg-[#155e34] text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All ({recs.length})
            </button>
            <button
              onClick={() => setFilterPriority('HIGH')}
              className={`px-3 py-1 rounded-lg transition-colors ${filterPriority === 'HIGH' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'}`}
            >
              High Priority ({highCount})
            </button>
            <button
              onClick={() => setFilterPriority('MEDIUM')}
              className={`px-3 py-1 rounded-lg transition-colors ${filterPriority === 'MEDIUM' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'}`}
            >
              Medium ({mediumCount})
            </button>
            <button
              onClick={() => setFilterPriority('LOW')}
              className={`px-3 py-1 rounded-lg transition-colors ${filterPriority === 'LOW' ? 'bg-emerald-700 text-white' : 'text-emerald-700 hover:bg-emerald-50'}`}
            >
              Low ({lowCount})
            </button>
          </div>
        </div>
      </div>

      {/* Recommendation Action Cards List */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs text-center text-xs text-slate-500 font-medium">
            {recs.length === 0
              ? 'No recommendations available yet. Run an analysis to generate your farm advisory.'
              : 'No recommendations match this priority filter.'}
          </div>
        )}
        {filtered.map((rec) => {
          const isDone = !!completedTasks[rec.id];

          return (
            <div
              key={rec.id}
              className={`bg-white rounded-2xl p-5 md:p-6 border transition-all duration-200 shadow-xs ${
                isDone 
                  ? 'bg-slate-50/80 border-slate-200 opacity-75' 
                  : rec.priority === 'HIGH' 
                  ? 'border-rose-200/80 hover:border-rose-300' 
                  : 'border-slate-100/90 hover:border-emerald-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Left Content */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      rec.priority === 'HIGH'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : rec.priority === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {rec.priority} PRIORITY
                    </span>

                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Category: {rec.category}
                    </span>

                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{rec.timing}</span>
                    </div>
                  </div>

                  {/* Title & Short Text */}
                  <div>
                    <h3 className={`text-base sm:text-lg font-bold font-display ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {rec.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                      {rec.shortText}
                    </p>
                    {rec.detectedContext && (
                      <div className="flex items-start gap-1.5 mt-2 text-[11px] font-medium text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                        <Info className="w-3 h-3 mt-0.5 shrink-0 text-blue-500" />
                        <span>{rec.detectedContext}</span>
                      </div>
                    )}
                  </div>

                  {/* Detailed Explanation */}
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    {rec.fullExplanation}
                  </p>

                  {/* Action Steps Box */}
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Suggested Recommended Action:</span>
                    </div>
                    <p className="font-medium text-emerald-900 pl-5">
                      {rec.actionRequired}
                    </p>
                  </div>

                  {/* Organic & IPM Alternative */}
                  {rec.organicAlternative && (
                    <div className="flex items-start gap-2 text-xs text-slate-600 pt-1">
                      <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800">Organic / Natural Alternative: </span>
                        <span>{rec.organicAlternative}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Action: Mark Done Button */}
                <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 pt-2 md:pt-0">
                  <button
                    onClick={() => toggleTaskDone(rec.id)}
                    className={`w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Check className={`w-4 h-4 ${isDone ? 'text-white stroke-[3]' : 'text-slate-400'}`} />
                    <span>{isDone ? 'Completed' : 'Mark as Done'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
