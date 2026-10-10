import React, { useState } from 'react';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  LogIn,
  UserPlus,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30';

export default function LoginView({ initialMode = 'login', onNavigateHome }) {
  const { login, register, enterDemoMode, error, setError, initializing } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!email.trim() || !password) {
      setError('Please fill in your email and password.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name to create an account.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch {
      /* error message is surfaced from AuthContext via `error` */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex items-center justify-center px-4 py-8 text-slate-800 antialiased font-sans">
      <div className="w-full max-w-md space-y-5">
        {/* Back to Home link if handler provided */}
        {onNavigateHome && (
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-800 transition-colors cursor-pointer mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        )}

        {/* Brand Header (same logo mark as the app shell) */}
        <div className="flex flex-col items-center text-center">
          <div
            onClick={onNavigateHome}
            className={`w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-200/60 shadow-xs mb-3 ${
              onNavigateHome ? 'cursor-pointer hover:scale-105 transition-transform' : ''
            }`}
          >
            <svg className="w-9 h-9" viewBox="0 0 32 32" fill="none">
              <path d="M16 5C11.5 5 6 8.5 6 16C6 24.5 13.5 29 16 29C18.5 29 26 24.5 26 16C26 8.5 20.5 5 16 5Z" fill="#F59E0B" />
              <path d="M17.5 5C17.5 3 16 1.8 14.5 2" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M17 5C20.5 3.5 24 4.5 25 7C22 7.5 18.5 7 17 5Z" fill="#16A34A" />
            </svg>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 font-display">MangoSense</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Mango Yield Prediction — sign in to sync your farms, analyses & advisories.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs space-y-4">
          {/* Login / Register toggle (same segmented style as filter tabs) */}
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login' ? 'bg-[#155e34] text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register' ? 'bg-[#155e34] text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="auth-name">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Patil"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="auth-email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="auth-password">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || initializing}
              className="w-full bg-[#155e34] hover:bg-[#124d2b] disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{mode === 'register' ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>{mode === 'register' ? 'Create My Account' : 'Sign In to MangoSense'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Offline Demo Mode (honestly labelled) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-xs space-y-3 text-center">
          <button
            type="button"
            onClick={enterDemoMode}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Continue in Demo Mode</span>
          </button>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Runs <strong>fully offline</strong> with bundled sample data — no account and no backend
            required. Anything shown in demo mode is labelled <em>Demo Data</em> inside the app.
          </p>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          MangoSense v1.0 • Yield intelligence for mango orchards
        </p>
      </div>
    </div>
  );
}
