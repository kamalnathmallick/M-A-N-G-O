/**
 * MangoSense Authentication Context (spec §6 / CONTRACT.md §3 Auth).
 *
 * - POST /auth/register {name,email,password} -> { token, user }
 * - POST /auth/login    {email,password}      -> { token, user }
 * - GET  /auth/me                              -> { user }
 *
 * Token is stored in localStorage key `mangosense_token` (the only key
 * apiClient.js reads) plus the cached user under `mangosense_user`.
 * Degrades gracefully when the backend is down: an existing session keeps
 * working offline, and an explicit (clearly labelled) demo mode is offered
 * from LoginView so the app remains usable without a backend.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';

const AuthContext = createContext(null);

const TOKEN_KEY = 'mangosense_token';
const USER_KEY = 'mangosense_user';
const DEMO_KEY = 'mangosense_demo_mode';

const readJson = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readJson(USER_KEY));
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem(DEMO_KEY) === 'true');
  // Initializing only when there is a stored token to validate (offline-safe).
  const [initializing, setInitializing] = useState(() => !!localStorage.getItem(TOKEN_KEY));
  const [error, setError] = useState(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(DEMO_KEY);
    setUser(null);
    setDemoMode(false);
  }, []);

  // Validate any stored token against GET /auth/me on first load.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return undefined;
    }
    let cancelled = false;
    // Check whether the stored session was a demo session BEFORE the async
    // call overwrites state — we need to preserve the demo flag if so.
    const wasDemo = localStorage.getItem(DEMO_KEY) === 'true';

    apiClient
      .get('/auth/me')
      .then((res) => {
        if (cancelled) return;
        const nextUser = (res && res.user) || res;
        if (nextUser && (nextUser.email || nextUser.id)) {
          const restoredUser = wasDemo ? { ...nextUser, isDemo: true } : nextUser;
          setUser(restoredUser);
          setDemoMode(wasDemo);
          localStorage.setItem(USER_KEY, JSON.stringify(restoredUser));
          if (!wasDemo) localStorage.removeItem(DEMO_KEY);
        } else {
          clearSession();
          setError('Could not restore your session. Please sign in again.');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err && (err.status === 401 || err.status === 403)) {
          // Token rejected by the backend — force a fresh sign-in.
          clearSession();
          setError('Your session has expired. Please sign in again.');
        }
        // Network/offline errors keep the cached user so the app stays usable offline.
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const data = await apiClient.post('/auth/login', { email, password });
      const nextUser = (data && data.user) || null;
      if (!data || !data.token || !nextUser) {
        throw new Error('The server returned an invalid sign-in response.');
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      localStorage.removeItem(DEMO_KEY);
      setUser(nextUser);
      setDemoMode(false);
      return nextUser;
    } catch (err) {
      const message = err && err.message ? err.message : 'Sign-in failed. Please try again.';
      setError(message);
      throw err;
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const data = await apiClient.post('/auth/register', { name, email, password });
      const nextUser = (data && data.user) || null;
      if (!data || !data.token || !nextUser) {
        throw new Error('The server returned an invalid registration response.');
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      localStorage.removeItem(DEMO_KEY);
      setUser(nextUser);
      setDemoMode(false);
      return nextUser;
    } catch (err) {
      const message = err && err.message ? err.message : 'Registration failed. Please try again.';
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setError(null);
  }, [clearSession]);

  /**
   * Demo mode — tries to get a real signed JWT from POST /auth/demo so that
   * authenticated endpoints (e.g. POST /predictions/bud) accept requests from
   * the demo session.  Falls back to the original token-free offline mode when
   * the backend is unreachable so the app still works without a server.
   */
  const enterDemoMode = useCallback(async () => {
    setError(null);
    const offlineFallback = () => {
      const demoUser = {
        id: 'demo-user',
        name: 'Demo Farmer',
        email: 'demo@mangosense.local',
        isDemo: true
      };
      localStorage.removeItem(TOKEN_KEY);
      localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
      localStorage.setItem(DEMO_KEY, 'true');
      setUser(demoUser);
      setDemoMode(true);
    };

    try {
      const data = await apiClient.post('/auth/demo', {});
      if (data && data.token && data.user) {
        // Real JWT obtained — store it so apiClient attaches it to every request.
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify({ ...data.user, isDemo: true }));
        localStorage.setItem(DEMO_KEY, 'true');
        setUser({ ...data.user, isDemo: true });
        setDemoMode(true);
      } else {
        offlineFallback();
      }
    } catch {
      // Backend unreachable — degrade gracefully to token-free offline mode.
      offlineFallback();
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      demoMode,
      initializing,
      error,
      setError,
      isAuthenticated: !!user && !demoMode,
      login,
      register,
      logout,
      enterDemoMode
    }),
    [user, demoMode, initializing, error, login, register, logout, enterDemoMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

export default AuthContext;
