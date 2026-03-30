import apiClient from './api';

export const getProfile = async () => {
  const response = await apiClient.get('/users/profile/');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await apiClient.patch('/users/profile/', data);
  return response.data;
};
