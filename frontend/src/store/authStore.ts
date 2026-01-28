import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, UserInfo } from '../api/auth';

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: UserInfo) => void;
  setToken: (token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: localStorage.getItem('authToken'),
      isAuthenticated: !!localStorage.getItem('authToken'),
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setToken: (token) => {
        localStorage.setItem('authToken', token);
        set({ token, isAuthenticated: true });
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          localStorage.setItem('authToken', response.access_token);
          set({
            token: response.access_token,
            user: {
              id: response.user_id,
              name: response.name,
              email: response.email,
              onboarding_completed: false,
              current_stage: 'STAGE_1_PROFILE',
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signup: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.signup({
            name,
            email,
            password,
          });
          localStorage.setItem('authToken', response.access_token);
          set({
            token: response.access_token,
            user: {
              id: response.user_id,
              name: response.name,
              email: response.email,
              onboarding_completed: false,
              current_stage: 'STAGE_1_PROFILE',
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || 'Signup failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('authToken');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        authApi.logout();
      },

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const user = await authApi.getCurrentUser();
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
