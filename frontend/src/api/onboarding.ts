import { apiClient } from './client';

export interface OnboardingData {
  // Academic Background
  education_level?: string;
  major?: string;
  graduation_year?: number;
  academic_score?: string;

  // Study Goals
  target_degree?: string;
  field?: string;
  intake_year?: number;
  countries?: string[];

  // Budget
  budget_range?: string;
  funding_type?: string;

  // Exams & Readiness
  ielts_status?: string;
  gre_status?: string;
  sop_status?: string;
}

export interface OnboardingResponse {
  message: string;
  onboarding_completed: boolean;
  current_stage: string;
  stage_name: string;
}

export const onboardingApi = {
  completeOnboarding: async (data: OnboardingData): Promise<OnboardingResponse> => {
    const response = await apiClient.post('/api/onboarding', data);
    return response.data;
  },

  updateProfile: async (data: OnboardingData): Promise<OnboardingResponse> => {
    const response = await apiClient.patch('/api/onboarding', data);
    return response.data;
  },

  getOnboardingStatus: async (): Promise<OnboardingResponse> => {
    const response = await apiClient.get('/api/onboarding/status');
    return response.data;
  },
};
