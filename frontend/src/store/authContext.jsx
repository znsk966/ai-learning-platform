import React, { createContext, useState, useContext } from 'react';
import apiClient from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Get the token from localStorage on initial load
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  // We'll add user data later, for now token is enough
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      return { token: savedToken };
    }
    return null;
  });
  const loading = false;

  const login = (newToken, refreshToken = null) => {
    // Set the new token in localStorage so it persists across refreshes
    localStorage.setItem('accessToken', newToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser({ token: newToken });
  };

  const logout = () => {
    // Remove tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete apiClient.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  // The value that will be available to all components that use this context
  const value = { token, user, login, logout, isAuthenticated: !!token };

  // Don't render children until the initial loading is done
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// This is a custom hook that makes it easy to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};