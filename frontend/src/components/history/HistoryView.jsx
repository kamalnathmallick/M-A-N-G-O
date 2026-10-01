import React, { useState } from 'react';
import { 
  History as HistoryIcon, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  GitCompare,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
export default function HistoryView({ history = [], onStartNewAnalysis, onSelectRecordForInspection }) {
  // Records are loaded in App.jsx via mockHistoryService.getHistory()
  // (GET /history) and passed down; mock records are the offline fallback.
  const records = Array.isArray(history) ? history : [];
  const [selectedId, setSelectedId] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareAId, setCompareAId] = useState(null);
  const [compareBId, setCompareBId] = useState(null);

  const selectedRecord = records.find((r) => r.id === selectedId) || records[0];
  const compareRecordA = records.find((r) => r.id === compareAId) || records[0];
  const compareRecordB = records.find((r) => r.id === compareBId) || records[1] || records[0];

  // Truthful data-source badge: records carry isDemo (CONTRACT.md §3 History)
  const recordsAreDemo = records.length === 0 || records.every((r) => r.isDemo !== false);

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Date,Plot,Bud Health,Flower Drop Risk,Predicted Yield,Samples"]
        .concat(records.map(r => `${r.date},${r.plot},${r.budHealth}%,${r.flowerDropRisk},"${r.predictedYield}",${r.sampleCount}`))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "MangoSense_Crop_History_PlotA.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
              {recordsAreDemo ? 'Demo Data' : 'Live Model Result'}
            </span>
            <span className="text-slate-400">•</span>
            <span>Historical Crop Tracking Timeline</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
            Analysis History & Harvest Trends
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Review past flower-bud evaluations and compare stage-by-stage progression.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              compareMode ? 'bg-[#155e34] text-white border-transparent' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>{compareMode ? 'Exit Comparison' : 'Compare 2 Cycles'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Compare Mode Side-by-Side Panel */}
      {compareMode && (
        <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-md space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-base text-slate-900 font-display">
                Side-by-Side Cycle Comparison
              </h3>
            </div>
            <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-3 py-1 rounded-full">
              Evaluating Growth Delta
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cycle A */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Cycle 1 (Previous)</span>
                <select
                  value={compareRecordA.id}
                  onChange={(e) => setCompareAId(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1"
                >
                  {records.map(r => (
                    <option key={r.id} value={r.id}>{r.date} — {r.plot}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Bud Health Score:</span>
                  <span className="font-bold text-slate-900">{compareRecordA.budHealth}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Flower Drop Risk:</span>
                  <span className="font-bold text-amber-700">{compareRecordA.flowerDropRisk}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Yield Predicted:</span>
                  <span className="font-bold text-slate-900">{compareRecordA.predictedYield}</span>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  <strong>Notes:</strong> {compareRecordA.keyObservation}
                </div>
              </div>
            </div>

            {/* Cycle B */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase">Cycle 2 (Latest)</span>
                <select
                  value={compareRecordB.id}
                  onChange={(e) => setCompareBId(e.target.value)}
                  className="text-xs font-bold bg-white border border-emerald-200 rounded-lg px-2.5 py-1"
                >
                  {records.map(r => (
                    <option key={r.id} value={r.id}>{r.date} — {r.plot}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-emerald-100">
                  <span className="text-slate-600">Bud Health Score:</span>
                  <span className="font-bold text-emerald-900">
                    {compareRecordB.budHealth}% 
                    <span className="ml-1 text-[10px] text-emerald-700">({compareRecordB.budHealth >= compareRecordA.budHealth ? `+${compareRecordB.budHealth - compareRecordA.budHealth}%` : `${compareRecordB.budHealth - compareRecordA.budHealth}%`})</span>
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-100">
                  <span className="text-slate-600">Flower Drop Risk:</span>
                  <span className="font-bold text-slate-900">{compareRecordB.flowerDropRisk}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-100">
                  <span className="text-slate-600">Yield Predicted:</span>
                  <span className="font-bold text-emerald-900">{compareRecordB.predictedYield}</span>
                </div>
                <div className="text-[11px] text-slate-600 pt-1">
                  <strong>Notes:</strong> {compareRecordB.keyObservation}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Historical Cards List */}
      <div className="space-y-3">
        {records.map((rec) => (
          <div
            key={rec.id}
            onClick={() => setSelectedId(rec.id)}
            className="bg-white rounded-2xl p-5 border border-slate-100/90 hover:border-emerald-200 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
          >
            {/* Left: Date & Plot */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-emerald-50 text-slate-600 group-hover:text-emerald-700 flex flex-col items-center justify-center shrink-0 transition-colors">
                <span className="text-xs font-bold leading-none">{rec.date.split(' ')[0]}</span>
                <span className="text-[10px] font-semibold uppercase">{rec.date.split(' ')[1]}</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 font-display">
                    {rec.plotDetails}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">
                    {rec.time}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {rec.keyObservation}
                </p>
              </div>
            </div>

            {/* Middle: Metrics Pill */}
            <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
              {/* Bud Health */}
              <div className="text-left sm:text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Bud Health</div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 mt-0.5">
                  {rec.healthyBudsText}
                </span>
              </div>

              {/* Drop Risk */}
              <div className="text-left sm:text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Drop Risk</div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mt-0.5 ${
                  rec.flowerDropRisk === 'Low'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                    : rec.flowerDropRisk === 'Moderate'
                    ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                    : 'bg-rose-50 text-rose-800 border-rose-200/60'
                }`}>
                  {rec.flowerDropRisk}
                </span>
              </div>

              {/* Yield */}
              <div className="text-left sm:text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Predicted Yield</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {rec.predictedYield}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all shrink-0 hidden sm:block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
