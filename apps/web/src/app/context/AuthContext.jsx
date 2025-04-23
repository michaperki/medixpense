// apps/web/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import apiClient from '@/lib/apiClient'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Set axios default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    
    setLoading(false);
  }, []);
  
  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const res = await apiClient.post('/auth/login', { email, password });
      
      setUser(res.data.user);
      setToken(res.data.token);
      
      // Store auth data
      localStorage.setItem('authToken', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Set axios default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      return res.data.user;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };
  
  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    
    // Remove auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Remove axios auth header
    delete axios.defaults.headers.common['Authorization'];
  };
  
  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      const res = await axios.post('/api/auth/register', userData);
      
      setUser(res.data.user);
      setToken(res.data.token);
      
      // Store auth data
      localStorage.setItem('authToken', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Set axios default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      return res.data.user;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      error, 
      login, 
      logout, 
      register,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
