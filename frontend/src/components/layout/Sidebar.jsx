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
          className="flex items-center gap-3 px-2 py-2 mb-6 cursor-pointer group"
        >
          {/* Custom Mango Icon */}
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200/60 shadow-xs group-hover:scale-105 transition-transform">
            <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 5C11.5 5 6 8.5 6 16C6 24.5 13.5 29 16 29C18.5 29 26 24.5 26 16C26 8.5 20.5 5 16 5Z" fill="#F59E0B" />
              <path d="M17.5 5C17.5 3 16 1.8 14.5 2" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M17 5C20.5 3.5 24 4.5 25 7C22 7.5 18.5 7 17 5Z" fill="#16A34A" />
              <circle cx="13" cy="14" r="1.5" fill="#D97706" opacity="0.4" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-lg leading-tight text-slate-900 tracking-tight font-display flex items-center gap-1">
              MangoSense
            </div>
            <div className="text-xs text-slate-500 font-medium tracking-wide">
              Mango Yield Prediction
            </div>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#155e34] text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-emerald-200' : 'text-slate-400 group-hover:text-emerald-700'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.isResearch && (
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    ML Lab
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
          {SECONDARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#155e34] text-white'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-emerald-200' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Promotional Card (As in reference image) */}
      <div className="mt-6 rounded-2xl bg-gradient-to-b from-[#F0F7F0] to-[#E5F2E5] p-4 text-center border border-emerald-100/80 shadow-xs relative overflow-hidden">
        {/* Plant seedling art */}
        <div className="w-12 h-12 mx-auto mb-2.5 rounded-full bg-white/90 shadow-xs flex items-center justify-center text-emerald-700">
          <Sprout className="w-6 h-6 stroke-[2.2]" />
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
