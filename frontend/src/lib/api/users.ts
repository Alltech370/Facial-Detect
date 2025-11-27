import apiClient from './client';
import type { User, UsersResponse, RegisterRequest, RegisterResponse, ApiResponse } from '@/types';

export const usersApi = {
  // Get all users
  getUsers: async (): Promise<UsersResponse> => {
    const response = await apiClient.get('/api/users');
    return response.data;
  },

  // Register new user
  registerUser: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('photo', data.photo);

    const response = await apiClient.post('/api/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete user
  deleteUser: async (userId: number): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/api/users/${userId}`);
    return response.data;
  },

  // Delete all users
  deleteAllUsers: async (): Promise<ApiResponse> => {
    const response = await apiClient.delete('/api/users');
    return response.data;
  },
};
