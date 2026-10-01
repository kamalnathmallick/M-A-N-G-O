import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Bell, 
  Scale, 
  Check, 
  Smartphone, 
  ShieldCheck,
  Save
} from 'lucide-react';

export default function SettingsView() {
  const [language, setLanguage] = useState('English');
  const [unitSystem, setUnitSystem] = useState('Metric (Tonnes / Acre)');
  const [pushAlerts, setPushAlerts] = useState(true);
  const [rainAlerts, setRainAlerts] = useState(true);
  const [pestAlerts, setPestAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <SettingsIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Preferences & Configuration</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
            Application Settings
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Customize language, regional varieties, unit systems, and weather alerts.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="bg-[#155e34] hover:bg-[#124d2b] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer self-start md:self-auto"
        >
          {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Saved Changes!' : 'Save Preferences'}</span>
        </button>
      </div>

      {/* Language & Regional Settings */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 font-display flex items-center gap-2 pb-2 border-b border-slate-100">
          <Globe className="w-4 h-4 text-emerald-700" />
          <span>Regional & Language Options</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Display Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800"
            >
              <option value="English">English</option>
              <option value="Marathi">मराठी (Marathi - Konkan Edition)</option>
              <option value="Hindi">हिंदी (Hindi)</option>
              <option value="Telugu">తెలుగు (Telugu - Andhra Mango Belt)</option>
              <option value="Tamil">தமிழ் (Tamil)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Measurement Units
            </label>
            <select
              value={unitSystem}
              onChange={(e) => setUnitSystem(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800"
            >
              <option value="Metric (Tonnes / Acre)">Metric (Tonnes / Acre & °C)</option>
              <option value="Quintals / Acre">Quintals / Acre & °C</option>
              <option value="Boxes / Tree">Dozen Boxes / Tree</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications & Early Warnings */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 font-display flex items-center gap-2 pb-2 border-b border-slate-100">
          <Bell className="w-4 h-4 text-emerald-700" />
          <span>Early Warning & Weather Alerts</span>
        </h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">Pre-Rain Fungal Alert</div>
              <div className="text-[11px] text-slate-500">Receive notifications 48h prior to forecast rain for prophylactic sprays.</div>
            </div>
            <input
              type="checkbox"
              checked={rainAlerts}
              onChange={(e) => setRainAlerts(e.target.checked)}
              className="w-5 h-5 accent-[#155e34] rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">Mango Hopper & Pest Flare Warnings</div>
              <div className="text-[11px] text-slate-500">Alerts when canopy humidity and temperature indicate peak nymph emergence.</div>
            </div>
            <input
              type="checkbox"
              checked={pestAlerts}
              onChange={(e) => setPestAlerts(e.target.checked)}
              className="w-5 h-5 accent-[#155e34] rounded"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
