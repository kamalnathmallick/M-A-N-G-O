import React from 'react';
import { Info, Sparkles, ArrowRight } from 'lucide-react';

export default function PrototypeBanner({ onOpenResearchModal }) {
  return (
    <div className="rounded-2xl bg-[#f0fdf4] border border-emerald-200/80 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-700 text-xs sm:text-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
          <Info className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="font-semibold text-emerald-950">Prototype Research Mode: </span>
          <span className="text-emerald-900/90">
            Predictions and insights are generated using realistic demo data. Deep learning CNN & yield models are pending dataset integration.
          </span>
        </div>
      </div>

      {onOpenResearchModal && (
        <button
          onClick={onOpenResearchModal}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shrink-0 transition-colors shadow-2xs"
        >
          <Sparkles className="w-3 h-3 text-emerald-200" />
          <span>View ML Architecture</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
