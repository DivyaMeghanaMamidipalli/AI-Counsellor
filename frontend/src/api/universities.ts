import { apiClient } from './client';

export interface University {
  id: number;
  name: string;
  country: string;
  avg_cost: number;
  fields: string[];
  category?: string;
  locked?: boolean;
  cost_fit?: string | null;
  risk_level?: string | null;
  acceptance_likelihood?: string | null;
  why_medium?: string[] | null;
}

export interface ShortlistRequest {
  university_id: number;
  category: 'Dream' | 'Target' | 'Safe';
}

export interface LockUniversityRequest {
  university_id: number;
}

export interface UnlockUniversityResponse {
  message: string;
  warning?: string | null;
}

export interface UniversityRecommendations {
  dream: University[];
  target: University[];
  safe: University[];
}

export const universitiesApi = {
  getRecommendations: async (): Promise<{ dream: University[]; target: University[]; safe: University[] }> => {
    const response = await apiClient.get('/api/universities/recommendations');
    return response.data;
  },

  shortlistUniversity: async (universityId: number, category: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/universities/shortlist', {
      university_id: universityId,
      category,
    });
    return response.data;
  },

  getShortlisted: async (): Promise<University[]> => {
    const response = await apiClient.get('/api/universities/shortlisted');
    return response.data.shortlisted_universities || [];
  },

  lockUniversity: async (universityId: number): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/universities/lock', {
      university_id: universityId,
    });
    return response.data;
  },

  unlockUniversity: async (universityId: number): Promise<UnlockUniversityResponse> => {
    const response = await apiClient.post('/api/universities/unlock', {
      university_id: universityId,
    });
    return response.data;
  },

  getLocked: async (): Promise<University[]> => {
    const response = await apiClient.get('/api/universities/locked');
    return response.data.locked_universities || [];
  },

  removeFromShortlist: async (universityId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/universities/shortlist/${universityId}`);
    return response.data;
  },

  getAllUniversities: async (): Promise<University[]> => {
    const response = await apiClient.get('/api/universities/all');
    return response.data.universities || [];
  },
};
