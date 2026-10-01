import React from 'react';
import { 
  LayoutDashboard, 
  Trees, 
  PlusCircle, 
  CloudSun, 
  History, 
  Lightbulb,
  Sparkles
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'farms', label: 'Farms', icon: Trees },
    { id: 'new-analysis', label: 'New Analysis', icon: PlusCircle, highlight: true },
    { id: 'climate', label: 'Climate', icon: CloudSun },
    { id: 'recommendations', label: 'Advice', icon: Lightbulb },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 px-1 xs:px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        if (item.highlight) {
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center -mt-5 relative group px-1"
            >
              <div className="w-11 h-11 xs:w-12 xs:h-12 rounded-full bg-[#155e34] text-white flex items-center justify-center shadow-lg shadow-emerald-900/30 group-active:scale-95 transition-transform">
                <Icon className="w-5 h-5 xs:w-6 xs:h-6" />
              </div>
              <span className="text-[9px] xs:text-[10px] font-bold text-emerald-900 mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-1 xs:px-2 rounded-lg transition-colors ${
              isActive ? 'text-[#155e34] font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className={`w-4.5 h-4.5 xs:w-5 xs:h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[9px] xs:text-[10px] font-medium mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
