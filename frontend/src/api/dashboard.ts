import { apiClient } from './client';

export interface ProfileSummary {
  education_level?: string;
  major?: string;
  graduation_year?: number;
  academic_score?: string;
  target_degree?: string;
  field?: string;
  intake_year?: number;
  countries?: string[];
  budget_range?: string;
  funding_type?: string;
  ielts_status?: string;
  gre_status?: string;
  sop_status?: string;
}

export interface StageInfo {
  current_stage: string;  // Returns "STAGE_1_PROFILE", "STAGE_2_DISCOVERY", etc.
  stage_name: string;
  onboarding_completed: boolean;
  shortlist_count: number;
  locked_count: number;
}

// Helper function to convert stage string to number
export const getStageNumber = (stage: string): number => {
  switch (stage) {
    case 'STAGE_1_PROFILE':
      return 1;
    case 'STAGE_2_DISCOVERY':
      return 2;
    case 'STAGE_3_LOCKING':
      return 3;
    case 'STAGE_4_APPLICATION':
      return 4;
    default:
      return 1;
  }
};

export interface TaskInfo {
  id: number;
  title: string;
  stage?: string;
  status: string;
}

export interface ShortlistedUniversity {
  university_id: number;
  university_name: string;
  country: string;
  category: string;
  locked: boolean;
}

export interface DashboardResponse {
  profile?: ProfileSummary;
  stage: StageInfo;
  tasks: TaskInfo[];
  shortlisted_universities: ShortlistedUniversity[];
}

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardResponse> => {
    const response = await apiClient.get('/api/dashboard');
    return response.data;
  },
};
