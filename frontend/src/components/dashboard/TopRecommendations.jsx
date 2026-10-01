import React from 'react';
import { 
  Droplet, 
  Bug, 
  Flower2, 
  Package, 
  ArrowRight,
  Sparkles,
  CloudRain
} from 'lucide-react';

export default function TopRecommendations({ recommendations, onViewAllRecommendations, onSelectRecommendation }) {
  // Grab top 4 recommendations
  const topList = recommendations.slice(0, 4);

  const getIcon = (category) => {
    switch (category) {
      case 'WATER':
        return <Droplet className="w-4 h-4 text-blue-600" />;
      case 'PEST':
        return <Bug className="w-4 h-4 text-emerald-700" />;
      case 'POLLINATION':
        return <Flower2 className="w-4 h-4 text-amber-600" />;
      case 'NUTRITION':
      default:
        return <Package className="w-4 h-4 text-amber-700" />;
    }
  };

  const getCardBg = (category) => {
    switch (category) {
      case 'WATER':
        return 'bg-blue-50/20 border-blue-100 hover:border-blue-200';
      case 'PEST':
        return 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-200';
      case 'POLLINATION':
        return 'bg-amber-50/20 border-amber-100 hover:border-amber-200';
      case 'NUTRITION':
      default:
        return 'bg-purple-50/20 border-purple-100 hover:border-purple-200';
    }
  };

  const getBadgeStyle = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-extrabold';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200 font-bold';
      case 'LOW':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base md:text-lg text-slate-900 font-display">
              Top Recommendations
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Actionable agronomic tasks for the next 7 days
            </span>
          </div>
          <button
            onClick={onViewAllRecommendations}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200/50"
          >
            All Advisory
          </button>
        </div>

        {/* 4 Cards Grid (Matching reference image layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {topList.map((rec) => (
            <div
              key={rec.id}
              onClick={() => onSelectRecommendation ? onSelectRecommendation(rec) : onViewAllRecommendations()}
              className={`rounded-xl p-3.5 border transition-all duration-150 flex flex-col justify-between cursor-pointer group hover:shadow-xs ${getCardBg(rec.category)}`}
            >
              <div>
                {/* Icon & Priority Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-2xs flex items-center justify-center">
                    {getIcon(rec.category)}
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded tracking-wide border ${getBadgeStyle(rec.priority)}`}>
                    {rec.priority}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-emerald-800 transition-colors">
                  {rec.category === 'WATER' ? 'Irrigation' : rec.category === 'PEST' ? 'Pest Control' : rec.category === 'POLLINATION' ? 'Pollination' : 'Nutrition'}
                </h4>

                {/* Short Advisory Text */}
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-3">
                  {rec.shortText}
                </p>
              </div>

              {/* View Details link */}
              <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center gap-1 text-[11px] font-bold text-slate-700 group-hover:text-emerald-800 transition-colors">
                <span>View Details</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-50 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Prioritized based on active bloom stage
        </span>
        <span className="text-emerald-700 font-semibold cursor-pointer" onClick={onViewAllRecommendations}>
          Print Advisory Sheet
        </span>
      </div>
    </div>
  );
}
