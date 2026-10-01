import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function RecentAnalysesTable({ history, onViewAll, onSelectRecord }) {
  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base md:text-lg text-slate-900 font-display">
              Recent Analyses
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Historical assessments for Plot A
            </span>
          </div>
          <button
            onClick={onViewAll}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200/50"
          >
            View All
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-2.5 font-semibold">Date</th>
                <th className="pb-2.5 font-semibold">Plot</th>
                <th className="pb-2.5 font-semibold">Bud Health</th>
                <th className="pb-2.5 font-semibold">Flower Drop Risk</th>
                <th className="pb-2.5 font-semibold">Predicted Yield</th>
                <th className="pb-2.5 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.slice(0, 4).map((row) => (
                <tr 
                  key={row.id}
                  onClick={() => onSelectRecord && onSelectRecord(row)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 font-semibold text-slate-800 whitespace-nowrap">
                    {row.date}
                  </td>
                  <td className="py-3 text-slate-600 font-medium whitespace-nowrap">
                    {row.plot}
                  </td>
                  <td className="py-3">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                      {row.healthyBudsText || `${row.budHealth}%`}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      row.flowerDropRisk === 'Low'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                        : row.flowerDropRisk === 'Moderate'
                        ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                        : 'bg-rose-50 text-rose-800 border-rose-200/60'
                    }`}>
                      {row.flowerDropRisk}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-slate-900 whitespace-nowrap">
                    {row.predictedYield}
                  </td>
                  <td className="py-3 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-50 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Showing last 4 flower-bud tracking cycles</span>
        <span className="text-emerald-700 font-semibold cursor-pointer" onClick={onViewAll}>
          Export Logs
        </span>
      </div>
    </div>
  );
}
