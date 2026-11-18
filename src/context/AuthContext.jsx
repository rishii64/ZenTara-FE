import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export const ROLE_PERMISSIONS = {
  Admin: ['dashboard', 'pos', 'sales', 'returns', 'products', 'categories', 'suppliers', 'purchases', 'inventory', 'daily_closing', 'reports', 'users', 'settings'],
  'Store Manager': ['dashboard', 'pos', 'sales', 'returns', 'products', 'inventory', 'daily_closing', 'reports'],
  'Inventory Staff': ['dashboard', 'products', 'categories', 'suppliers', 'purchases', 'inventory'],
  'Cashier': ['pos', 'sales', 'returns', 'daily_closing']
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('zen_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('zen_token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await api.login(username, password);
      localStorage.setItem('zen_token', data.token);
      localStorage.setItem('zen_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('zen_token');
    localStorage.removeItem('zen_user');
    setUser(null);
    setToken(null);
  };

  const hasPermission = (moduleName) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    const allowed = ROLE_PERMISSIONS[user.role] || [];
    return allowed.includes(moduleName);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
