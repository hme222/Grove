import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, userAPI } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('grove_access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await userAPI.getMe();
      setUser(res.data);
    } catch (e) {
      localStorage.removeItem('grove_access_token');
      localStorage.removeItem('grove_refresh_token');
      setUser(null);
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

  const logout = () => {
    localStorage.removeItem('grove_access_token');
    localStorage.removeItem('grove_refresh_token');
    setUser(null);
  };

  const updateUser = (data) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, fetchUser, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
