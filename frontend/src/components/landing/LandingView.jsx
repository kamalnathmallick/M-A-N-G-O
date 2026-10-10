import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  CloudSun,
  Sprout,
  Lightbulb,
  CheckCircle2,
  Menu,
  X,
  ChevronRight,
  LogIn,
  UserPlus,
  Compass,
  Scan,
  Layers,
  Info
} from 'lucide-react';

export default function LandingView({ onNavigateLogin, onNavigateRegister, onGoToDashboard, isAuthenticated }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8] text-[#111827] antialiased font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* =========================================================================
          1. NAVIGATION HEADER
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Brand Logo, Name & Subtitle */}
          <div 
            onClick={() => scrollToSection('hero')} 
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            {/* 3D-styled Mango Brand Icon */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/90 flex items-center justify-center border border-amber-200/80 shadow-3d-icon-amber group-hover:scale-105 transition-all duration-200">
              <svg className="w-7 h-7 drop-shadow-xs" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 5C11.5 5 6 8.5 6 16C6 24.5 13.5 29 16 29C18.5 29 26 24.5 26 16C26 8.5 20.5 5 16 5Z" fill="#F59E0B" />
                <path d="M17.5 5C17.5 3 16 1.8 14.5 2" stroke="#15803D" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M17 5C20.5 3.5 24 4.5 25 7C22 7.5 18.5 7 17 5Z" fill="#16A34A" />
                <circle cx="13" cy="14" r="1.5" fill="#D97706" opacity="0.4" />
              </svg>
            </div>
            <div>
              <div className="font-extrabold text-xl leading-tight text-slate-900 tracking-tight font-display flex items-center gap-1.5">
                <span>MangoSense</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
              </div>
              <div className="text-[11px] text-slate-500 font-medium tracking-wide">
                Smart Mango Crop Insights
              </div>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <button
              onClick={() => scrollToSection('hero')}
              className="hover:text-[#166534] transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-[#166534] transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#166534] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('product-preview')}
              className="hover:text-[#166534] transition-colors cursor-pointer"
            >
              Workspace
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="hover:text-[#166534] transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={onGoToDashboard}
                className="bg-[#166534] hover:bg-[#14532D] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={onNavigateLogin}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={onNavigateRegister}
                  className="bg-[#166534] hover:bg-[#14532D] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-600">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-[#166534] cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-[#166534] cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-[#166534] cursor-pointer"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('product-preview')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-[#166534] cursor-pointer"
              >
                Workspace Preview
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-[#166534] cursor-pointer"
              >
                About MangoSense
              </button>
            </nav>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <button
                  onClick={onGoToDashboard}
                  className="w-full bg-[#166534] text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={onNavigateLogin}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={onNavigateRegister}
                    className="w-full bg-[#166534] hover:bg-[#14532D] text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Get Started</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION (Highest Priority Reference Alignment)
         ========================================================================= */}
      <section id="hero" className="relative pt-12 pb-20 md:pt-18 md:pb-28 overflow-hidden">
        {/* Soft, layered ambient lighting in background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-emerald-100/40 via-emerald-50/20 to-transparent pointer-events-none -z-10 blur-3xl" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-amber-100/30 rounded-full pointer-events-none -z-10 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            
            {/* Left Column: Headline, Description, CTAs & Benefits */}
            <div className="lg:col-span-6 xl:col-span-7 space-y-7 text-center lg:text-left">
              
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[#166534] text-xs font-bold tracking-wider uppercase shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>SMART AGRICULTURE · MANGO CROP INTELLIGENCE</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 font-display tracking-tight leading-[1.12]">
                Understand Your Mango Crop.{' '}
                <span className="text-[#166534] block sm:inline">Make Smarter Decisions.</span>
              </h1>

              {/* Supporting Description */}
              <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                MangoSense helps mango farmers assess flower-bud health, explore climate conditions,
                understand crop risks, and view preliminary yield estimates using image-based AI and
                agricultural insights.
              </p>

              {/* Primary & Secondary Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                {isAuthenticated ? (
                  <button
                    onClick={onGoToDashboard}
                    className="w-full sm:w-auto bg-[#166534] hover:bg-[#14532D] text-white px-8 py-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onNavigateRegister}
                    className="w-full sm:w-auto bg-[#166534] hover:bg-[#14532D] text-white px-8 py-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => scrollToSection('features')}
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-[#E5E7EB] px-7 py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:border-slate-300"
                >
                  <Compass className="w-4 h-4 text-[#166534]" />
                  <span>Explore Features</span>
                </button>
              </div>

              {/* 3 Compact Benefit Cards with Dimensional / 3D Icon styling */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
                {/* Highlight 1 */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-3d-card transition-all flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-[#166534] flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-3d-icon">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 leading-snug block">
                      AI-Based Bud Classification
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Binary Potential</span>
                  </div>
                </div>

                {/* Highlight 2 */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-3d-card transition-all flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-3d-icon-amber">
                    <CloudSun className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 leading-snug block">
                      Climate-Aware Insights
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">15-Day Weather</span>
                  </div>
                </div>

                {/* Highlight 3 */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-3d-card transition-all flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-[#166534] flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-3d-icon">
                    <Lightbulb className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 leading-snug block">
                      Actionable Recommendations
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Rule Engine</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual - Large Orchard Photograph with Floating Analysis Card */}
            <div className="lg:col-span-6 xl:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Subtle 3D background glow and tilt accent */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-[#166534]/15 via-emerald-500/10 to-[#F59E0B]/15 rounded-3xl blur-xl -z-10" />

                {/* Main Image Container */}
                <div className="bg-white rounded-3xl p-2.5 border border-[#E5E7EB] shadow-2xl overflow-hidden relative">
                  
                  {/* Photo Frame with real mango bud sample */}
                  <div className="relative h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden bg-slate-900 group">
                    <img
                      src="/samples/landing_orchard.jpg"
                      alt="Mango flower panicle sample during blooming stage in an orchard"
                      className="w-full h-full object-cover object-center transform group-hover:scale-102 transition-transform duration-500"
                      loading="eager"
                    />
                    
                    {/* Dark gradient overlay for caption contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-slate-950/20" />

                    {/* Top Overlay Badge */}
                    <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/60 flex items-center gap-2 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="text-xs font-bold text-slate-900">MobileNetV3 Classification</span>
                    </div>

                    {/* Bottom Translucent Caption Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
                        OBSERVED SPECIMEN
                      </div>
                      <div className="text-base font-bold truncate tracking-tight drop-shadow-sm">
                        Panicle Elongation & Anthesis
                      </div>
                    </div>
                  </div>

                  {/* Floating Analysis Preview Card (Layered & Dimensional) */}
                  <div className="mt-2.5 p-4 sm:p-5 bg-white rounded-2xl border border-slate-100 shadow-3d-card space-y-3.5">
                    
                    {/* Header line of card */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#166534] border border-emerald-200/80 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Good Yield Potential</span>
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">94.2% Confidence</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">Plot A • North Canopy</span>
                    </div>

                    {/* 3 Metric Indicators */}
                    <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                        <div className="text-[10px] text-slate-500 font-medium">Bud Health</div>
                        <div className="text-base font-extrabold text-[#166534] mt-0.5">88%</div>
                        <div className="text-[9px] text-slate-400 font-semibold">Healthy Buds</div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                        <div className="text-[10px] text-slate-500 font-medium">Yield Est.</div>
                        <div className="text-base font-extrabold text-slate-900 mt-0.5">4.8 T/A</div>
                        <div className="text-[9px] text-slate-400 font-semibold">Rule-based</div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                        <div className="text-[10px] text-slate-500 font-medium">Drop Risk</div>
                        <div className="text-base font-extrabold text-amber-600 mt-0.5">Moderate</div>
                        <div className="text-[9px] text-slate-400 font-semibold">Monitored</div>
                      </div>
                    </div>

                    {/* Transparency footnote on preview card */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
                      <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="italic">Illustrative demo preview from MangoSense bud observation workflow.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          3. FEATURES SECTION
         ========================================================================= */}
      <section id="features" className="py-20 md:py-28 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-[#166534] text-xs font-bold tracking-wide uppercase border border-emerald-200/60 shadow-2xs">
              <Cpu className="w-3.5 h-3.5" />
              <span>Core Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              Everything You Need to Understand Your Mango Crop
            </h2>
            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
              Explore flower-bud health, environmental conditions, and practical crop-management insights in one workspace.
            </p>
          </div>

          {/* 4 Feature Cards with 3D tactile icon treatments */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
            
            {/* Feature 1: Flower-Bud Classification */}
            <div className="bg-[#F7FAF8] rounded-3xl p-7 border border-[#E5E7EB] shadow-3d-card shadow-3d-card-hover transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-[#166534] flex items-center justify-center mb-6 shadow-3d-icon border border-emerald-300/60">
                  <Scan className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-display mb-2.5">
                  Flower-Bud Classification
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  The MobileNetV3 CNN model analyzes uploaded flower-bud images and classifies them into the available model classes (Good or Poor Yield Potential).
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center gap-1.5 text-xs font-bold text-[#166534]">
                <span>Image-level AI inference</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 2: Climate & Weather Insights */}
            <div className="bg-[#F7FAF8] rounded-3xl p-7 border border-[#E5E7EB] shadow-3d-card shadow-3d-card-hover transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800 flex items-center justify-center mb-6 shadow-3d-icon-amber border border-amber-300/60">
                  <CloudSun className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-display mb-2.5">
                  Climate & Weather Insights
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  The interface presents available weather variables and 15-day forecast information to help farmers monitor crop conditions and environmental stresses.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <span>15-day temperature & humidity</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 3: Preliminary Yield Estimation */}
            <div className="bg-[#F7FAF8] rounded-3xl p-7 border border-[#E5E7EB] shadow-3d-card shadow-3d-card-hover transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-[#166534] flex items-center justify-center mb-6 shadow-3d-icon border border-emerald-300/60">
                  <Sprout className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-display mb-2.5">
                  Preliminary Yield Estimation
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  View farm-level yield estimates informed by classification and climate data. Current yield estimates are rule-based, not predictions from a trained yield-regression model.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center gap-1.5 text-xs font-bold text-[#166534]">
                <span>Preliminary rule formulas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 4: Agricultural Recommendations */}
            <div className="bg-[#F7FAF8] rounded-3xl p-7 border border-[#E5E7EB] shadow-3d-card shadow-3d-card-hover transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-[#166534] flex items-center justify-center mb-6 shadow-3d-icon border border-emerald-300/60">
                  <Lightbulb className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-display mb-2.5">
                  Agricultural Recommendations
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Review practical guidance and risk indicators generated using available classification results, climate information, and rule-based agricultural risk logic.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center gap-1.5 text-xs font-bold text-[#166534]">
                <span>Targeted farm interventions</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          4. HOW IT WORKS SECTION
         ========================================================================= */}
      <section id="how-it-works" className="py-20 md:py-28 bg-[#F7FAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-[#166534] text-xs font-bold tracking-wide uppercase border border-emerald-200/60 shadow-2xs">
              <span>Simple 3-Step Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              From Flower-Bud Images to Farm Insights
            </h2>
            <p className="text-base sm:text-lg text-[#64748B]">
              A straightforward progression designed to fit into ordinary seasonal orchard monitoring.
            </p>
          </div>

          {/* 3 Step Timeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB] shadow-3d-card shadow-3d-card-hover transition-all duration-300 flex flex-col justify-between relative">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#166534] text-white flex items-center justify-center font-extrabold font-display text-lg shadow-3d-icon">
                    1
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 01</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-display mb-3">
                  Upload Flower-Bud Images
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Upload clear images of mango flowers or buds for analysis. Supports standard JPG, JPEG, and PNG formats.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Canopy photos & panicle closeups</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB] shadow-3d-card shadow-3d-card-hover transition-all duration-300 flex flex-col justify-between relative">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#166534] text-white flex items-center justify-center font-extrabold font-display text-lg shadow-3d-icon">
                    2
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 02</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-display mb-3">
                  Review Crop and Climate Insights
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Explore classification results alongside available weather and crop information to understand health and environmental pressure.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Confidence score & weather trend</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB] shadow-3d-card shadow-3d-card-hover transition-all duration-300 flex flex-col justify-between relative">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#166534] text-white flex items-center justify-center font-extrabold font-display text-lg shadow-3d-icon">
                    3
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 03</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-display mb-3">
                  Plan Your Next Action
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Review preliminary yield estimates and relevant agricultural recommendations to plan irrigation, protection, and orchard care.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Advisory action cards & yield baseline</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          5. PRODUCT PREVIEW SECTION (Showcasing MangoSense Dashboard Workspace)
         ========================================================================= */}
      <section id="product-preview" className="py-20 md:py-28 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-[#166534] text-xs font-bold tracking-wide uppercase border border-emerald-200/60 shadow-2xs">
              <Layers className="w-3.5 h-3.5" />
              <span>Workspace Overview</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              Your Farm Insights, in One Workspace
            </h2>
            <p className="text-base sm:text-lg text-[#64748B]">
              A cohesive dashboard engineered for real-world orchard monitoring across flowering stages.
            </p>
          </div>

          {/* Product Preview Mockup Window */}
          <div className="bg-slate-900 rounded-3xl p-3 sm:p-6 shadow-2xl border border-slate-800 max-w-5xl mx-auto perspective-1000">
            
            {/* Top Bar of the Mockup Window */}
            <div className="bg-slate-800/90 rounded-2xl px-5 py-3.5 flex items-center justify-between text-xs text-slate-300 mb-4 border border-slate-700/70">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="font-semibold text-slate-200 pl-2">MangoSense Farm Workspace</span>
              </div>
              <div className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Product Preview</span>
              </div>
            </div>

            {/* Simulated Workspace Inner Content */}
            <div className="bg-[#F7FAF8] rounded-2xl p-5 sm:p-7 text-slate-800 space-y-6">
              
              {/* Simulated Farm Header with Farm Selector & Active Season */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#166534]">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Farm: Green Valley Orchard</div>
                    <div className="text-xs text-slate-500">Selected Plot: Plot A (North Canopy)</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100/70 text-[#166534] text-xs font-bold border border-emerald-200/60">
                    Active Season 2026
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-semibold">
                    14 Analyses Recorded
                  </span>
                </div>
              </div>

              {/* 4 Dashboard Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-3d-card">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Expected Yield</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">4.8 T/Acre</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Rule-based estimate</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-3d-card">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Bud Health</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#166534] mt-1">88% Healthy</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">MobileNetV3 evaluation</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-3d-card">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Flower Drop Risk</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-1">Moderate</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">Maintain light irrigation</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-3d-card">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Climate Risk</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#166534] mt-1">Low / Favorable</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">31°C • 62% humidity</div>
                </div>
              </div>

              {/* Two Column Feature Breakdown in Workspace */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Bud classification highlights */}
                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-3d-card space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Scan className="w-4 h-4 text-[#166534]" />
                      <span>Flower-Bud Classification Summary</span>
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Binary Model Output
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-2">
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span>• Good Yield Potential:</span>
                      <strong className="text-emerald-800 font-semibold">High Panicle Density</strong>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span>• Poor Yield Potential:</span>
                      <strong className="text-amber-800 font-semibold">Underdeveloped / Sparse</strong>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span>• Per-Image Probabilities:</span>
                      <span className="text-slate-800 font-semibold">94.2% top confidence</span>
                    </div>
                  </div>
                </div>

                {/* Practical Recommendations Card */}
                <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-3d-card space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-600" />
                      <span>Agricultural Action Cards</span>
                    </span>
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Advisory Rules
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-2">
                    <p className="leading-relaxed">• Avoid flood irrigation during peak bloom to reduce drop rate.</p>
                    <p className="leading-relaxed">• Check midday canopy temperatures when forecast exceeds 34°C.</p>
                    <p className="leading-relaxed">• Review analysis history across plots before applying micronutrients.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Call to Action inside Product Preview */}
            <div className="mt-5 p-3 text-center">
              <button
                onClick={onNavigateRegister}
                className="inline-flex items-center gap-2 bg-[#166534] hover:bg-[#14532D] text-white px-7 py-3.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
              >
                <span>Start Your Farm Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. ABOUT & TRANSPARENCY SECTION
         ========================================================================= */}
      <section id="about" className="py-20 md:py-28 bg-[#F7FAF8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E5E7EB] shadow-3d-card relative overflow-hidden">
            {/* Background botanical illustration decoration */}
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none">
              <svg className="w-88 h-88" viewBox="0 0 32 32" fill="none">
                <path d="M16 5C11.5 5 6 8.5 6 16C6 24.5 13.5 29 16 29C18.5 29 26 24.5 26 16C26 8.5 20.5 5 16 5Z" fill="#166534" />
              </svg>
            </div>

            <div className="max-w-2xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-[#166534] text-xs font-bold tracking-wide uppercase border border-emerald-200/60 shadow-2xs">
                <span>About MangoSense</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
                Practical Crop Insights, With Transparency
              </h2>
              <p className="text-base text-[#64748B] leading-relaxed">
                MangoSense combines image-based flower-bud classification with climate information and agricultural rules to help users explore crop conditions. It is engineered to support regular canopy inspection and seasonal decision-making throughout the flowering cycle.
              </p>

              <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#166534]" />
                  <span>Mobile-friendly responsive interface</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#166534]" />
                  <span>Synchronized plot & weather records</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#166534]" />
                  <span>Transparent model classification output</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#166534]" />
                  <span>Rule-guided actionable farm advisories</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Transparency & Trust Notice */}
          <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-4 text-xs text-amber-950 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-800 border border-amber-200">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="space-y-1.5">
              <div className="font-extrabold text-amber-900 uppercase tracking-wide text-xs">
                Transparency & Agricultural Advisory Notice
              </div>
              <p className="leading-relaxed text-amber-900/90 text-xs sm:text-[13px]">
                Flower-bud classification uses the current CNN model. Yield estimates are rule-based and should be treated as preliminary estimates, not guaranteed harvest outcomes. Recommendations should be considered alongside local agricultural expertise.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          7. FINAL CALL TO ACTION
         ========================================================================= */}
      <section className="py-20 md:py-28 bg-[#F0FDF4] border-t border-emerald-100/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center border border-emerald-200 shadow-3d-icon mx-auto text-[#166534]">
            <Sprout className="w-8 h-8 stroke-[2.2]" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 font-display tracking-tight">
            Ready to Explore Your Mango Crop Insights?
          </h2>

          <p className="text-base sm:text-lg text-[#64748B] max-w-xl mx-auto leading-relaxed">
            Start with your farm, review your crop observations, and explore the insights available in MangoSense.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            {isAuthenticated ? (
              <button
                onClick={onGoToDashboard}
                className="w-full sm:w-auto bg-[#166534] hover:bg-[#14532D] text-white px-8 py-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={onNavigateRegister}
                  className="w-full sm:w-auto bg-[#166534] hover:bg-[#14532D] text-white px-8 py-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Get Started</span>
                </button>
                <button
                  onClick={onNavigateLogin}
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-800 border border-[#E5E7EB] px-7 py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:border-slate-300"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER
         ========================================================================= */}
      <footer className="bg-white border-t border-[#E5E7EB] py-14 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
            {/* Brand Logo & Description */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-200/60 shadow-3d-icon-amber">
                <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                  <path d="M16 5C11.5 5 6 8.5 6 16C6 24.5 13.5 29 16 29C18.5 29 26 24.5 26 16C26 8.5 20.5 5 16 5Z" fill="#F59E0B" />
                  <path d="M17.5 5C17.5 3 16 1.8 14.5 2" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M17 5C20.5 3.5 24 4.5 25 7C22 7.5 18.5 7 17 5Z" fill="#16A34A" />
                </svg>
              </div>
              <div>
                <div className="font-extrabold text-base text-slate-900 font-display">MangoSense</div>
                <div className="text-slate-500 text-[11px]">Smart insights for mango crop monitoring.</div>
              </div>
            </div>

            {/* Navigation and auth links */}
            <div className="flex flex-wrap items-center gap-6 font-semibold">
              <button onClick={() => scrollToSection('hero')} className="hover:text-[#166534] transition-colors cursor-pointer">
                Home
              </button>
              <button onClick={() => scrollToSection('features')} className="hover:text-[#166534] transition-colors cursor-pointer">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#166534] transition-colors cursor-pointer">
                How It Works
              </button>
              <button onClick={() => scrollToSection('product-preview')} className="hover:text-[#166534] transition-colors cursor-pointer">
                Workspace
              </button>
              <button onClick={() => scrollToSection('about')} className="hover:text-[#166534] transition-colors cursor-pointer">
                About
              </button>
              <button onClick={onNavigateLogin} className="hover:text-[#166534] transition-colors cursor-pointer">
                Sign In
              </button>
              <button onClick={onNavigateRegister} className="text-[#166534] hover:underline cursor-pointer">
                Get Started
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
            <div>
              © {new Date().getFullYear()} MangoSense. All rights reserved.
            </div>
            <div>
              AI-assisted bud classification & preliminary rule-based yield estimation.
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
