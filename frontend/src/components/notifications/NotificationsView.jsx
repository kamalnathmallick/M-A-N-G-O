import React from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CloudRain, 
  Sparkles, 
  Clock, 
  CheckCircle2,
  Trash2,
  ArrowRight
} from 'lucide-react';

export default function NotificationsView({ onNavigateToRecommendations }) {
  const notifications = [
    {
      id: 1,
      title: 'Rain Warning: Pre-rain protective spray needed',
      desc: 'Showers expected on 27 August (16 mm). Protect active panicles from powdery mildew with sulphur spray before tomorrow afternoon.',
      time: '2 hours ago',
      type: 'warning',
      category: 'Weather & Fungicide'
    },
    {
      id: 2,
      title: 'Batch Bud Analysis Completed',
      desc: '4 new sample panicles processed for Plot A. Health score recorded at 81% healthy.',
      time: 'Today, 09:30 AM',
      type: 'success',
      category: 'Inference Update'
    },
    {
      id: 3,
      title: 'Optimal Anthesis Weather Window',
      desc: 'Mild winds and 29°C temperature over next 3 days are ideal for honeybee foraging and pollination.',
      time: 'Yesterday',
      type: 'info',
      category: 'Pollination'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Bell className="w-3.5 h-3.5 text-emerald-600" />
            <span>Farm Feed</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
            Notifications & Crop Alerts
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Real-time micro-climate warnings, hopper activity alerts & task reminders.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`bg-white rounded-2xl p-5 border shadow-xs transition-all flex items-start gap-4 ${
              n.type === 'warning' ? 'border-amber-200/80 bg-amber-50/20' : 'border-slate-100/90'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              n.type === 'warning' ? 'bg-amber-100 text-amber-700' : n.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {n.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : n.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {n.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">{n.time}</span>
              </div>
              <h4 className="font-bold text-sm sm:text-base text-slate-900 font-display">
                {n.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {n.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
