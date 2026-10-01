import React, { useState, useEffect } from 'react';
import { 
  Trees, 
  Plus, 
  MapPin, 
  Calendar, 
  Sprout, 
  Droplet, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  PlusCircle,
  Clock,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { mockFarmService } from '../../services/mockFarmService';

export default function MyFarmsView({ onSelectPlotForAnalysis, onStartNewAnalysis }) {
  // Farms are fetched from the backend (GET /farms) with mock fallback —
  // never initialised from the MOCK_FARMS constant directly.
  const [farms, setFarms] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [loadError, setLoadError] = useState(null);
  const [selectedFarmIndex, setSelectedFarmIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    mockFarmService
      .getFarms()
      .then((res) => {
        if (cancelled) return;
        if (Array.isArray(res) && res.length > 0) {
          setFarms(res);
          setLoadState('ready');
        } else {
          setFarms([]);
          setLoadError('The server returned no orchards for your account.');
          setLoadState('error');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setFarms([]);
        setLoadError(err?.message || 'Could not load your orchards. Please try again.');
        setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeFarm = farms[selectedFarmIndex] || farms[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Trees className="w-3.5 h-3.5 text-emerald-600" />
            <span>Farm & Orchard Directory</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
            My Mango Orchards & Plots
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Manage your registered orchards, tree varieties, soil health parameters & plot zones.
          </p>
        </div>

        <button
          onClick={onStartNewAnalysis}
          className="bg-[#155e34] hover:bg-[#124d2b] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-emerald-200" />
          <span>Add New Plot Assessment</span>
        </button>
      </div>

      {/* Loading / Error states inside the standard container (§30/§22) */}
      {loadState === 'loading' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs flex items-center justify-center gap-3 text-xs sm:text-sm font-medium text-slate-500">
          <RefreshCw className="w-4 h-4 text-emerald-700 animate-spin" />
          <span>Loading your orchards & plots…</span>
        </div>
      )}

      {loadState === 'error' && (
        <div className="bg-white rounded-2xl p-6 border border-rose-200/80 shadow-xs flex items-start gap-3 text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Could not load your farms. </span>
            <span className="font-medium">{loadError}</span>
          </div>
        </div>
      )}

      {loadState === 'ready' && activeFarm && (
      <>
      {/* Farm Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {farms.map((farm, idx) => (
          <button
            key={farm.id}
            onClick={() => setSelectedFarmIndex(idx)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
              selectedFarmIndex === idx
                ? 'bg-[#155e34] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <Trees className="w-4 h-4" />
            <span>{farm.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedFarmIndex === idx ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {farm.plots.length} plots
            </span>
          </button>
        ))}
      </div>

      {/* Active Farm Overview Banner */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <span>{activeFarm.name}</span>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                Verified Orchard
              </span>
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{activeFarm.location}</span>
              <span>•</span>
              <span>Established {activeFarm.establishedYear}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70">
              <span className="text-slate-400">Total Area: </span>
              <span className="font-bold text-slate-900">{activeFarm.totalArea}</span>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70">
              <span className="text-slate-400">Soil: </span>
              <span className="font-bold text-slate-900">{activeFarm.soilType}</span>
            </div>
          </div>
        </div>

        {/* Plots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {activeFarm.plots.map((plot) => (
            <div
              key={plot.id}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Plot Title & Variety */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 font-display">
                      {plot.name}
                    </h4>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/40 inline-block mt-1">
                      {plot.variety}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {plot.treeCount} Trees
                  </span>
                </div>

                {/* Plot Metadata List */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">Flowering Stage:</span>
                    <span className="font-semibold text-slate-800 text-right">{plot.floweringStage}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">Bud Health Score:</span>
                    <span className="font-bold text-emerald-700">{plot.healthScore}% Healthy</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">Expected Yield:</span>
                    <span className="font-extrabold text-slate-900">{plot.expectedYield} {plot.yieldUnit}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">Flower Drop Risk:</span>
                    <span className={`font-bold ${plot.flowerDropRisk === 'Low' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {plot.flowerDropRisk}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Last check:
                    </span>
                    <span>{plot.lastAnalysisDate}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectPlotForAnalysis(activeFarm.id, plot.id)}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-[#155e34] border border-emerald-200/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <span>Launch Analysis for {plot.name.split('—')[0]}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
