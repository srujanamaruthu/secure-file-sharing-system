import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if token is valid on start/reload
  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        // Safe fallback
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auto-auth verification failed:', err.message);
      localStorage.removeItem('token');
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (identity, password) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { identity, password });
      if (response.data.success) {
        const userToken = response.data.token;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (username, email, password) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { username, email, password });
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration failed. Try again.';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      // Call logout endpoint to write Audit Log on backend
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout audit logging error:', err.message);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        checkAuth,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
