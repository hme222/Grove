import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, userAPI } from '../lib/api';

const AuthContext = createContext(null);
const USER_CACHE = 'grove_user_cache';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // True when we could not reach the server and have no saved copy of the profile to show.
  const [bootError, setBootError] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('grove_access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      setBootError(false);
      const res = await userAPI.getMe();
      setUser(res.data);
      try { localStorage.setItem(USER_CACHE, JSON.stringify(res.data)); } catch { /* storage can be blocked */ }
    } catch (e) {
      const refused = e?.response && e.response.status < 500;
      if (refused) {
        // The server answered and said this session is not valid: that is a real sign-out.
        localStorage.removeItem('grove_access_token');
        localStorage.removeItem('grove_refresh_token');
        try { localStorage.removeItem(USER_CACHE); } catch { /* ignore */ }
        setUser(null);
      } else {
        // The server could not be reached (offline, or down). The person is still signed in, so
        // keep them signed in and let each screen say it could not load.
        let cached = null;
        try { cached = JSON.parse(localStorage.getItem(USER_CACHE) || 'null'); } catch { /* ignore */ }
        if (cached) setUser(cached); else setBootError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('grove_access_token', res.data.access_token);
    localStorage.setItem('grove_refresh_token', res.data.refresh_token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (username, email, password, display_name) => {
    const res = await authAPI.register({ username, email, password, display_name });
    localStorage.setItem('grove_access_token', res.data.access_token);
    localStorage.setItem('grove_refresh_token', res.data.refresh_token);
    setUser(res.data.user);
    return res.data;
  };

  // Sign in with a session the server already made (Apple or Google).
  const acceptSession = (data) => {
    localStorage.setItem('grove_access_token', data.access_token);
    localStorage.setItem('grove_refresh_token', data.refresh_token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    try { localStorage.removeItem(USER_CACHE); } catch { /* ignore */ }
    localStorage.removeItem('grove_access_token');
    localStorage.removeItem('grove_refresh_token');
    setUser(null);
  };

  const updateUser = (data) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, bootError, login, register, acceptSession, logout, updateUser, fetchUser, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
