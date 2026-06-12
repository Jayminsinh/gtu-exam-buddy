/**
 * @file Authentication Context Provider
 * @description Manages global student/admin identity states and handles
 *              localStorage persistence and API profile syncing.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Verification on App Mount ─────────────────────────────
  useEffect(() => {
    const verifyCurrentUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          const profileData = response.data?.data?.user;
          if (profileData) {
            setUser(profileData);
          } else {
            localStorage.removeItem('accessToken');
          }
        } catch (error) {
          console.error('Failed to sync authenticated profile:', error);
          localStorage.removeItem('accessToken');
        }
      }
      setLoading(false);
    };

    verifyCurrentUser();
  }, []);

  // ─── Sign In Flow ──────────────────────────────────────────
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, user: profileData } = response.data?.data || {};

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    if (profileData) {
      setUser(profileData);
    }
    
    return response.data;
  };

  // ─── Sign Out Flow ─────────────────────────────────────────
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Failed to invalidate session on backend:', error);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be invoked within an AuthProvider scope.');
  }
  return context;
}
