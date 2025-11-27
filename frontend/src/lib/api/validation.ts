import apiClient from './client';
import type { ValidationRequest, ValidationResponse } from '@/types';

export const validationApi = {
  // Validate face
  validateFace: async (data: ValidationRequest): Promise<ValidationResponse> => {
    const response = await apiClient.post('/api/validate', data);
    return response.data;
  },
};
