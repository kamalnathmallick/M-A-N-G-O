import React from 'react';
import {
  LayoutDashboard,
  Trees,
  PlusCircle,
  CloudSun,
  History,
  Lightbulb,
  Bell,
  HelpCircle,
  Settings,
  Cpu,
  Sparkles,
  Sprout
} from 'lucide-react';
import NavIcon3D, { MangoLogo3D } from './NavIcon3D';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'farms', label: 'My Farms', icon: Trees },
  { id: 'new-analysis', label: 'New Analysis', icon: PlusCircle, badge: 'Quick' },
  { id: 'image-analysis', label: 'Bud Classification', icon: Sparkles },
  { id: 'climate', label: 'Climate & Forecast', icon: CloudSun },
  { id: 'yield', label: 'Yield Prediction', icon: Sprout },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  { id: 'history', label: 'History', icon: History },
  { id: 'research', label: 'Research & ML Status', icon: Cpu, isResearch: true }
];

const SECONDARY_NAV = [
  { id: 'notifications', label: 'Notifications', icon: Bell, count: 2 },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export default function Sidebar({ activeTab, setActiveTab, unreadCount = 2 }) {
  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-5 min-h-screen shrink-0 hidden md:flex select-none">
      <div>
        {/* Brand Logo & Title */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 px-2 py-2 mb-6 cursor-pointer group select-none"
        >
          {/* Custom 3D Mango Icon */}
          <MangoLogo3D size="md" />
          <div>
            <div className="font-bold text-lg leading-tight text-slate-900 tracking-tight font-display flex items-center gap-1.5">
              <span>MangoSense</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 shadow-xs" />
            </div>
            <div className="text-xs text-slate-500 font-medium tracking-wide">
              Mango Yield Prediction
            </div>
          </div>
        </div>

        {/* Primary Navigation Links with 3D Tactile Icons */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-b from-[#1a7340] to-[#13532e] text-white shadow-3d-nav-active -translate-y-0.5'
                    : 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-950 hover:shadow-3d-nav-item'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <NavIcon3D name={item.id} active={isActive} size="sm" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-b-2 ${
                    isActive
                      ? 'bg-amber-400 text-amber-950 border-amber-600 shadow-xs'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.isResearch && (
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border-b ${
                    isActive ? 'bg-white/20 text-white border-white/30' : 'bg-violet-100 text-violet-700 border-violet-300'
                  }`}>
                    ML Lab
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="pt-4 mt-4 border-t border-slate-100 space-y-1.5">
          {SECONDARY_NAV.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-b from-[#1a7340] to-[#13532e] text-white shadow-3d-nav-active -translate-y-0.5'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:shadow-3d-nav-item'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <NavIcon3D name={item.id} active={isActive} size="sm" />
                  <span>{item.label}</span>
                </div>
                {item.count && (
                  <span className="w-5 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 text-white text-[11px] font-bold flex items-center justify-center border-b-2 border-amber-700 shadow-xs">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Promotional Card (As in reference image) */}
      <div className="mt-6 rounded-2xl bg-gradient-to-b from-[#F0F7F0] to-[#E5F2E5] p-4 text-center border border-emerald-100/80 shadow-xs relative overflow-hidden group">
        {/* Plant seedling 3D art */}
        <div className="mx-auto mb-2.5 flex items-center justify-center">
          <NavIcon3D name="yield" size="lg" />
        </div>
        <h4 className="text-sm font-bold text-emerald-950 font-display leading-snug">
          Smart Decisions<br />Better Harvests
        </h4>
        <p className="text-[11px] text-emerald-800/80 mt-1 leading-relaxed">
          AI-powered insights for healthier mango crops
        </p>
      </div>
    </aside>
  );
}
