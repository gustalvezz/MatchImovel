import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        // Invalid user data, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((token, userData) => {
    // Set localStorage first
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Set axios header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Update state - this will trigger re-render
    setUser(userData);
    
    // Return a promise that resolves after state is set
    return new Promise((resolve) => {
      // Use setTimeout to ensure state update is processed
      setTimeout(() => resolve(userData), 0);
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  // Helper to get redirect path based on role
  const getRedirectPath = useCallback((role) => {
    switch (role) {
      case 'buyer': return '/dashboard/buyer';
      case 'agent': return '/dashboard/agent';
      case 'curator': return '/dashboard/curator';
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, getRedirectPath }}>
      {children}
    </AuthContext.Provider>
  );
};
