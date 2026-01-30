import { apiClient } from './client';

export interface CounsellorActionResult {
  type: 'shortlist' | 'lock' | 'create_task' | 'generate_tasks' | 'update_task' | string;
  status: 'executed' | 'skipped' | 'failed' | string;
  message: string;
  university_id?: number;
  task_id?: number;
}

export interface CounsellorTaskSummary {
  id: number;
  title: string;
  stage?: string;
  status: 'pending' | 'in_progress' | 'completed' | string;
}

export interface CounsellorUniversitySummary {
  id: number;
  name: string;
  country?: string;
  category?: string;
  locked?: boolean;
}

export interface CounsellorResponse {
  intent?: string;
  reply: string;
  recommendations?: {
    dream: number[];
    target: number[];
    safe: number[];
  };
  actions?: CounsellorActionResult[];
  tasks?: CounsellorTaskSummary[];
  locked_universities?: CounsellorUniversitySummary[];
  shortlisted_universities?: CounsellorUniversitySummary[];
}

export const counsellorApi = {
  sendMessage: async (message: string): Promise<CounsellorResponse> => {
    const response = await apiClient.post('/api/ai/counsellor', { message });
    return response.data;
  },
};