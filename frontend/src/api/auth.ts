import { apiClient } from './client';

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  name: string;
  email: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  onboarding_completed: boolean;
  current_stage: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

export interface ResetPasswordData {
  email: string;
  new_password: string;
}

export const authApi = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/signup', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/login', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<UserInfo> => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/auth/change-password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/auth/reset-password', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },
};
