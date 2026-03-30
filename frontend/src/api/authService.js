// src/api/authService.js
import apiClient from './api';

export const login = async (username, password) => {
  try {
    // CORRECTED: Added trailing slash
    const response = await apiClient.post('/token/', { username, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
};

export const register = async (userData) => {
    try {
        // CORRECTED: Added trailing slash
        const response = await apiClient.post('/users/register/', {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            password_confirm: userData.password_confirm || userData.password
        });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data;
        if (typeof errorMessage === 'object') {
            // Handle validation errors
            const errors = Object.values(errorMessage).flat().join(', ');
            throw new Error(errors || 'Registration failed');
        }
        throw new Error(error.response?.data?.detail || 'Registration failed');
    }
};

export const verifyEmail = async (token) => {
    try {
        const response = await apiClient.post('/users/verify-email/', { token });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data;
        if (typeof errorMessage === 'object') {
            const errors = Object.values(errorMessage).flat().join(', ');
            throw new Error(errors || 'Email verification failed');
        }
        throw new Error(error.response?.data?.error || error.response?.data?.detail || 'Email verification failed');
    }
};

export const resendVerificationEmail = async (email) => {
    try {
        const response = await apiClient.post('/users/resend-verification/', { email });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || 'Failed to resend verification email');
    }
};

export const requestPasswordReset = async (email) => {
    try {
        const response = await apiClient.post('/users/password-reset/', { email });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || 'Failed to send password reset email');
    }
};

export const confirmPasswordReset = async (token, newPassword, newPasswordConfirm) => {
    try {
        const response = await apiClient.post('/users/password-reset/confirm/', {
            token,
            new_password: newPassword,
            new_password_confirm: newPasswordConfirm
        });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data;
        if (typeof errorMessage === 'object') {
            const errors = Object.values(errorMessage).flat().join(', ');
            throw new Error(errors || 'Password reset failed');
        }
        throw new Error(error.response?.data?.error || error.response?.data?.detail || 'Password reset failed');
    }
};

export const changePassword = async (oldPassword, newPassword, newPasswordConfirm) => {
    try {
        const response = await apiClient.post('/users/password-change/', {
            old_password: oldPassword,
            new_password: newPassword,
            new_password_confirm: newPasswordConfirm
        });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data;
        if (typeof errorMessage === 'object') {
            const errors = Object.values(errorMessage).flat().join(', ');
            throw new Error(errors || 'Password change failed');
        }
        throw new Error(error.response?.data?.detail || 'Password change failed');
    }
};