import apiClient from './client';
import type { SystemStats, PassageStats, AccessLog, StatsResponse, PassageStatsResponse, LogsResponse, ApiResponse } from '@/types';

export const adminApi = {
  // Get system stats
  getStats: async (): Promise<StatsResponse> => {
    const response = await apiClient.get('/api/stats');
    return response.data;
  },

  // Get passage stats
  getPassageStats: async (): Promise<PassageStatsResponse> => {
    const response = await apiClient.get('/api/passage-stats');
    return response.data;
  },

  // Get access logs
  getLogs: async (limit: number = 50): Promise<LogsResponse> => {
    const response = await apiClient.get(`/api/logs?limit=${limit}`);
    return response.data;
  },

  // Clear all logs
  clearLogs: async (): Promise<ApiResponse> => {
    const response = await apiClient.delete('/api/logs/clear');
    return response.data;
  },

  // Clear entire database
  clearDatabase: async (): Promise<ApiResponse> => {
    const response = await apiClient.delete('/api/database/clear');
    return response.data;
  },
};
