import React, { useState } from 'react';
import { 
  ChevronDown, 
  SunMedium, 
  Trees, 
  User, 
  Languages, 
  Volume2, 
  Check, 
  Menu,
  Sparkles,
  MapPin,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TopBar({
  farms,
  selectedFarm,
  setSelectedFarm,
  selectedPlot,
  setSelectedPlot,
  weather,
  onOpenMobileMenu,
  onStartNewAnalysis
}) {
  const { user, demoMode, logout } = useAuth();
  const [showFarmDropdown, setShowFarmDropdown] = useState(false);
  const [showPlotDropdown, setShowPlotDropdown] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const currentFarmObj = farms.find(f => f.id === selectedFarm) || farms[0];
  const currentPlotObj = currentFarmObj?.plots.find(p => p.id === selectedPlot) || currentFarmObj?.plots[0];

  const handleAudioSummary = () => {
    setSpeaking(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Namaste Farmer! For ${currentPlotObj?.name || 'this plot'}, ${
        currentPlotObj?.healthScore != null
          ? `bud health is ${currentPlotObj.healthScore} percent healthy`
          : 'bud health has not been measured yet'
      }. ${
        currentPlotObj?.expectedYield
          ? `Expected yield is ${currentPlotObj.expectedYield} tonnes per acre.`
          : 'No yield estimate is stored yet.'
      } ${
        weather?.temperature != null
          ? `Weather is ${weather.condition ? weather.condition.toLowerCase() : 'moderate'} at ${weather.temperature} degrees Celsius.`
          : 'Live weather is unavailable right now.'
      } Please maintain light drip irrigation and monitor the canopy regularly.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setSpeaking(false), 3000);
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 px-3 sm:px-4 lg:px-8 py-3 sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4">
      {/* Mobile Menu Button + Greetings */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button 
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-slate-900 font-display tracking-tight truncate">
              Good morning, Farmer! 👋
            </h1>
            <span className="hidden sm:inline-block shrink-0 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/60 whitespace-nowrap">
              Active Season 2026
            </span>
          </div>
          <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-medium truncate">
            Let's check your mango crop health and yield prediction.
          </p>
        </div>
      </div>

      {/* Right Controls: Farm Dropdown, Plot Dropdown, Weather, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Audio Readout Tool for Farmers */}
        <button
          onClick={handleAudioSummary}
          title="Listen to summary audio advisory in simple speech"
          className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            speaking 
              ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
              : 'bg-emerald-50/70 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100'
          }`}
        >
          <Volume2 className={`w-3.5 h-3.5 ${speaking ? 'text-amber-700' : 'text-emerald-700'}`} />
          <span>{speaking ? 'Speaking...' : 'Voice Summary'}</span>
        </button>

        {/* Farm Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowFarmDropdown(!showFarmDropdown);
              setShowPlotDropdown(false);
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100/90 text-slate-700 text-xs sm:text-sm font-medium border border-slate-200/80 transition-colors shadow-2xs"
          >
            <Trees className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span className="max-w-[75px] xs:max-w-[110px] sm:max-w-[180px] truncate font-semibold text-slate-800">
              {currentFarmObj?.name}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {showFarmDropdown && (
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Mango Farm
              </div>
              {farms.map((farm) => (
                <button
                  key={farm.id}
                  onClick={() => {
                    setSelectedFarm(farm.id);
                    setSelectedPlot(farm.plots[0]?.id);
                    setShowFarmDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm flex items-center justify-between transition-colors ${
                    farm.id === selectedFarm 
                      ? 'bg-emerald-50 text-emerald-900 font-semibold' 
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{farm.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {farm.location}
                    </div>
                  </div>
                  {farm.id === selectedFarm && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Plot Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPlotDropdown(!showPlotDropdown);
              setShowFarmDropdown(false);
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100/90 text-slate-700 text-xs sm:text-sm font-medium border border-slate-200/80 transition-colors shadow-2xs"
          >
            <span className="max-w-[65px] xs:max-w-[95px] sm:max-w-[160px] truncate font-semibold text-slate-800">
              {currentPlotObj?.name}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {showPlotDropdown && (
            <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Farm Plot
              </div>
              {currentFarmObj?.plots.map((plot) => (
                <button
                  key={plot.id}
                  onClick={() => {
                    setSelectedPlot(plot.id);
                    setShowPlotDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm flex items-center justify-between transition-colors ${
                    plot.id === selectedPlot 
                      ? 'bg-emerald-50 text-emerald-900 font-semibold' 
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{plot.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Variety: {plot.variety}</div>
                  </div>
                  {plot.id === selectedPlot && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current Weather Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-slate-700">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
            <SunMedium className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-900 leading-none">
              {weather.temperature}{weather.temperatureUnit}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {weather.condition}
            </div>
          </div>
        </div>

        {/* Farmer Profile Pill — real signed-in user + logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200/80">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span className="hidden xl:inline-flex flex-col leading-tight max-w-[140px]">
            <span className="text-xs font-semibold text-slate-700 truncate">
              {user?.name || 'Farmer'}
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              {demoMode ? 'Demo Mode (offline)' : user?.email || ''}
            </span>
          </span>
          <button
            onClick={logout}
            title={demoMode ? 'Exit demo mode' : 'Sign out'}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition-colors cursor-pointer"
            aria-label="Sign out of MangoSense"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
