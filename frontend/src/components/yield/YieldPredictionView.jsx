import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ArrowRight, 
  Sliders, 
  DollarSign, 
  RotateCcw,
  Scale,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  ReferenceLine 
} from 'recharts';
import { mockPredictionService } from '../../services/mockPredictionService';

export default function YieldPredictionView({ 
  predictionData, 
  onNavigateToRecommendations,
  onStartNewAnalysis 
}) {
  // Sensitivity Simulator State
  const [simBudHealth, setSimBudHealth] = useState(78);
  const [simRainfall, setSimRainfall] = useState('Moderate');
  const [simPestControl, setSimPestControl] = useState(true);
  const [simMandiPricePerKg, setSimMandiPricePerKg] = useState(55); // ₹55/kg average Alphonso

  // Plot acreage derived from the latest prediction (fallback: demo 2.5 acres)
  const plotAcres =
    predictionData && predictionData.expectedYieldMin && predictionData.totalPlotExpectedMin
      ? +(predictionData.totalPlotExpectedMin / predictionData.expectedYieldMin).toFixed(1)
      : 2.5;
  const benchmark = predictionData?.benchmark || {};
  const benchmarkRegional = benchmark.regionalBenchmark || 4.5;
  const benchmarkLastYear = benchmark.farmLastYearYield || 4.5;
  const differenceFromLastYear = benchmark.differenceFromLastYear || '+13.3%';
  const factors = predictionData?.factors || {};

  // Offline fallback calculation (kept per spec) — used when the simulate API
  // errors; still flagged isDemo so the UI never claims it is live.
  const offlineYield = mockPredictionService.calculateDynamicPrediction({
    budHealth: simBudHealth,
    rainfallIntensity: simRainfall,
    pestControlActive: simPestControl,
    variety: 'Alphonso'
  });

  // What-If simulator: POST /predictions/simulate (debounced), falling back to
  // the offline calculation when the backend is unavailable.
  const [simResult, setSimResult] = useState(null);
  const [simStatus, setSimStatus] = useState('loading'); // 'loading' | 'live' | 'offline'
  const [simNote, setSimNote] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setSimStatus('loading');
    const timer = setTimeout(() => {
      mockPredictionService
        .simulateWhatIf({
          budHealth: simBudHealth,
          rainfallIntensity: simRainfall,
          pestControlActive: simPestControl,
          variety: 'Alphonso',
          plotAcres
        })
        .then((res) => {
          if (cancelled) return;
          setSimResult(res);
          setSimStatus(res && res.isDemo ? 'offline' : 'live');
          setSimNote((res && res.offlineReason) || null);
        })
        .catch((err) => {
          if (cancelled) return;
          setSimResult(null);
          setSimStatus('offline');
          setSimNote(err?.message || 'Yield simulation service unavailable.');
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [simBudHealth, simRainfall, simPestControl, plotAcres]);

  // Live result when available, explicitly-labelled offline estimate otherwise
  const dynamicYield = simResult || offlineYield;

  const totalMinTonnes = (dynamicYield.expectedYieldMin * plotAcres).toFixed(1);
  const totalMaxTonnes = (dynamicYield.expectedYieldMax * plotAcres).toFixed(1);

  // Revenue calc (1 tonne = 1000 kg)
  const estRevenueMin = Math.round(dynamicYield.expectedYieldMin * plotAcres * 1000 * simMandiPricePerKg);
  const estRevenueMax = Math.round(dynamicYield.expectedYieldMax * plotAcres * 1000 * simMandiPricePerKg);

  const scenarioData = [
    { scenario: 'Severe Drop', yield: 3.8, label: '3.8 t/ac', fill: '#f87171' },
    { scenario: 'Baseline Avg', yield: benchmarkLastYear, label: `${benchmarkLastYear} t/ac`, fill: '#94a3b8' },
    { scenario: 'Predicted (Current)', yield: dynamicYield.expectedYieldAverage, label: `${dynamicYield.expectedYieldMin}–${dynamicYield.expectedYieldMax} t/ac`, fill: '#15803d', isCurrent: true },
    { scenario: 'Optimal Care', yield: 5.8, label: '5.8 t/ac', fill: '#10b981' }
  ];

  const isDemoPrediction = !predictionData || predictionData.isDemo !== false;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-extrabold">
              {isDemoPrediction ? 'Demo Data' : 'Live Model Result'}
            </span>
            <span className="text-slate-400">•</span>
            <span>Early Flowering Stage Yield Model</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
            Farm Yield Prediction — {predictionData?.plotName || 'Plot A (2.5 Acres)'}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            AI-correlated early estimate combining multi-sample bud health, flower retention index & 15-day weather.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToRecommendations}
            className="bg-[#155e34] hover:bg-[#124d2b] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <span>What Should You Do?</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Central Hero Result Card (The most important result screen) */}
      <div className="bg-gradient-to-br from-[#f0fdf4] via-white to-[#f7faf7] rounded-3xl p-6 md:p-8 border border-emerald-200/80 shadow-sm relative overflow-hidden">
        {/* Background Subtle Mango Graphic */}
        <div className="absolute -right-6 -bottom-6 w-56 h-56 opacity-5 pointer-events-none">
          <svg viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 4C11.5 4 6 7.5 6 15c0 8.5 7.5 13 10 13s10-4.5 10-13c0-7.5-5.5-11-10-11z" />
          </svg>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Hero Yield Figure */}
          <div className="lg:col-span-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-950 text-xs font-bold border border-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Early Flowering Prediction Output</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight font-display">
                {dynamicYield.expectedYieldMin} – {dynamicYield.expectedYieldMax}
              </span>
              <span className="text-lg sm:text-xl font-bold text-emerald-800">
                tonnes / acre
              </span>
            </div>

            {/* Total Plot Yield */}
            <div className="p-3.5 rounded-2xl bg-white/90 border border-emerald-100 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-medium">Total Expected Crop ({predictionData?.plotName || 'Plot A — 2.5 acres'})</div>
                <div className="text-lg font-bold text-slate-900">
                  {totalMinTonnes} – {totalMaxTonnes} Tonnes
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">Estimated Revenue Potential</div>
                <div className="text-base font-extrabold text-emerald-700">
                  ₹{(estRevenueMin / 100000).toFixed(2)}L – ₹{(estRevenueMax / 100000).toFixed(2)} Lakhs
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Variety: <strong>{predictionData?.variety || 'Alphonso (Hapus)'}</strong> • Regional Benchmark Avg: {benchmarkRegional} t/acre
              </span>
            </div>
          </div>

          {/* Right Visual Comparison Chart */}
          <div className="lg:col-span-6 bg-white/90 rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 font-display">
                Yield Scenarios & Variety Benchmark
              </h4>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {differenceFromLastYear} vs Last Year
              </span>
            </div>

            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarioData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="scenario" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} />
                  <YAxis domain={[0, 7]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(val) => [`${val} tonnes/acre`, 'Yield']}
                    contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                  />
                  <ReferenceLine y={benchmarkLastYear} stroke="#64748b" strokeDasharray="3 3" label={{ value: 'Avg', fill: '#64748b', fontSize: 10, position: 'insideTopRight' }} />
                  <Bar dataKey="yield" radius={[6, 6, 0, 0]} barSize={28}>
                    {scenarioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Prediction Factors Breakdown (As required in prompt) */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 font-display">
              Key Prediction Factors
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Weight distribution contributing to the early yield calculation
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            Multi-modal Input Layer
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Factor 1: Bud Health */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">1. Bud Health</span>
              <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded shadow-2xs">
                {factors.budHealth?.value || '78% Healthy'}
              </span>
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              High Panicle Density
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Vigorous floral clusters detected across {factors.budHealth?.percentage ?? 78}% of canopy samples, contributing strongly to base yield.
            </p>
          </div>

          {/* Factor 2: Climate */}
          <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-950 uppercase tracking-wide">2. Climate</span>
              <span className="text-xs font-bold text-sky-700 bg-white px-2 py-0.5 rounded shadow-2xs">
                {factors.climate?.value || 'Favorable'}
              </span>
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              Anthesis Window
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              29°C average temperature promotes active pollinator foraging with minimal thermal desiccation.
            </p>
          </div>

          {/* Factor 3: Flower Drop Risk */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">3. Flower Drop Risk</span>
              <span className="text-xs font-bold text-amber-700 bg-white px-2 py-0.5 rounded shadow-2xs">
                {factors.flowerDropRisk?.value || 'Moderate'}
              </span>
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              Moisture & Rain Variance
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              7-day rainfall fluctuations may induce partial shedding if drip irrigation is mismanaged.
            </p>
          </div>

          {/* Factor 4: Pest Risk */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">4. Pest Risk</span>
              <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded shadow-2xs">
                {factors.pestRisk?.value || 'Low–Moderate'}
              </span>
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              Mango Hopper Presence
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Early hopper nymphs spotted on 1 of 4 sample clusters. Prompt treatment secures the upper yield band.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Yield Sensitivity Simulator */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-base text-slate-900 font-display">
              Farmer "What-If" Sensitivity Simulator
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Test how management changes impact your harvest
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Slider 1: Bud Health */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Simulate Bud Health</span>
              <span className="text-emerald-700 font-extrabold">{simBudHealth}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={simBudHealth}
              onChange={(e) => setSimBudHealth(Number(e.target.value))}
              className="w-full accent-[#155e34] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>50% (Poor)</span>
              <span>78% (Actual)</span>
              <span>95% (Peak)</span>
            </div>
          </div>

          {/* Selector 2: Rain Severity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Rain Severity Scenario</span>
              <span className="text-sky-700 font-extrabold">{simRainfall}</span>
            </div>
            <select
              value={simRainfall}
              onChange={(e) => setSimRainfall(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="Low">Low Rain / Dry (0–5 mm)</option>
              <option value="Moderate">Moderate Showers (5–15 mm)</option>
              <option value="High">Heavy Downpour (15–30 mm)</option>
            </select>
          </div>

          {/* Toggle 3: Pest Spray Active */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Pest & Mildew Spray</span>
              <span className={simPestControl ? 'text-emerald-700' : 'text-rose-600'}>
                {simPestControl ? 'Completed' : 'No Action Taken'}
              </span>
            </div>
            <button
              onClick={() => setSimPestControl(!simPestControl)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${
                simPestControl
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {simPestControl ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
              <span>{simPestControl ? 'Protective Spray Applied' : 'No Spray (Pest Risk)'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Adjusted Outcome Banner */}
        <div className="mt-3 p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-300 font-medium">Adjusted Simulated Yield:</div>
            <div className="text-xl font-black text-emerald-300 font-display">
              {dynamicYield.expectedYieldMin} – {dynamicYield.expectedYieldMax} tonnes/acre ({totalMinTonnes}–{totalMaxTonnes} t total)
            </div>
            {/* Truthful simulator source: live backend vs offline fallback (§22) */}
            <div className="text-[10px] font-semibold mt-1">
              {simStatus === 'loading' && (
                <span className="text-slate-400">Running live yield simulation…</span>
              )}
              {simStatus === 'live' && (
                <span className="text-emerald-300">Live backend simulation</span>
              )}
              {simStatus === 'offline' && (
                <span className="text-amber-300">
                  Offline estimate (demo) — {simNote || 'simulation service unavailable'}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setSimBudHealth(78);
              setSimRainfall('Moderate');
              setSimPestControl(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
}
