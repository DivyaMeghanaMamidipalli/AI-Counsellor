import { apiClient } from './client';

export interface CounsellorActionResult {
  type: 'shortlist' | 'lock' | 'create_task' | 'generate_tasks' | string;
  status: 'executed' | 'skipped' | 'failed' | string;
  message: string;
  university_id?: number;
  task_id?: number;
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
}

export const counsellorApi = {
  sendMessage: async (message: string): Promise<CounsellorResponse> => {
    const response = await apiClient.post('/api/ai/counsellor', { message });
    return response.data;
  },
};