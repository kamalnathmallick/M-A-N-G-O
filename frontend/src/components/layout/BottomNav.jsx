import React from 'react';
import NavIcon3D from './NavIcon3D';

export default function BottomNav({ activeTab, setActiveTab }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'farms', label: 'Farms' },
    { id: 'new-analysis', label: 'New Analysis', highlight: true },
    { id: 'climate', label: 'Climate' },
    { id: 'recommendations', label: 'Advice' },
    { id: 'history', label: 'History' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 px-1 xs:px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const isActive = activeTab === item.id;

        if (item.highlight) {
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center -mt-6 relative group px-1 cursor-pointer"
            >
              <NavIcon3D
                name={item.id}
                active={isActive}
                size="xl"
                theme="amber"
                className="rounded-2xl shadow-[0_10px_20px_-4px_rgba(245,158,11,0.5)]"
              />
              <span className="text-[9px] xs:text-[10px] font-bold text-emerald-900 mt-1 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`group flex flex-col items-center justify-center py-1 px-1 xs:px-2 rounded-lg transition-colors cursor-pointer ${
              isActive ? 'text-[#155e34] font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <NavIcon3D name={item.id} active={isActive} size="sm" />
            <span className="text-[9px] xs:text-[10px] font-medium mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
