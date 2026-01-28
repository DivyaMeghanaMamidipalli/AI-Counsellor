import { apiClient } from './client';

export interface Task {
  id: number;
  title: string;
  stage?: string;
  stage_name: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface TaskCreate {
  title: string;
  stage?: string;
}

export interface TaskUpdate {
  title?: string;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface TaskResponse {
  id: number;
  title: string;
  stage?: string;
  stage_name: string;
  status: string;
}

export const tasksApi = {
  getAllTasks: async (): Promise<Task[]> => {
    const response = await apiClient.get('/api/tasks');
    return response.data;
  },

  createTask: async (data: TaskCreate): Promise<TaskResponse> => {
    const response = await apiClient.post('/api/tasks', data);
    return response.data;
  },

  getTask: async (taskId: number): Promise<TaskResponse> => {
    const response = await apiClient.get(`/api/tasks/${taskId}`);
    return response.data;
  },

  updateTask: async (taskId: number, data: TaskUpdate): Promise<TaskResponse> => {
    const response = await apiClient.patch(`/api/tasks/${taskId}`, data);
    return response.data;
  },

  deleteTask: async (taskId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/tasks/${taskId}`);
    return response.data;
  },

  createBulkTasks: async (tasks: TaskCreate[]): Promise<Task[]> => {
    const response = await apiClient.post('/api/tasks/bulk', { tasks });
    return response.data;
  },

  getTasksByStage: async (stageName: string): Promise<Task[]> => {
    const response = await apiClient.get(`/api/tasks/by-stage/${stageName}`);
    return response.data;
  },

  generateDefaultTasks: async (): Promise<Task[]> => {
    const response = await apiClient.post('/api/tasks/generate-default');
    return response.data;
  },
};
