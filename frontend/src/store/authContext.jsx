import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Get the token from localStorage on initial load
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  // We'll add user data later, for now token is enough
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect runs whenever the token changes
    if (token) {
      // Set the Authorization header for all future API requests
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // You could fetch user profile here, for now we simplify
      setUser({ token: token });
    } else {
      // If there's no token, make sure the header is removed
      delete apiClient.defaults.headers.common['Authorization'];
    }
    // Finished checking for the token, so we can stop loading
    setLoading(false);
  }, [token]);

  const login = (newToken, refreshToken = null) => {
    // Set the new token in localStorage so it persists across refreshes
    localStorage.setItem('accessToken', newToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    setToken(newToken);
  };

  const logout = () => {
    // Remove tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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