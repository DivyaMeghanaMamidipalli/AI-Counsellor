import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { onboardingApi, OnboardingData } from '../api/onboarding';
import { dashboardApi, DashboardResponse, getStageNumber } from '../api/dashboard';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

interface ProfileState {
  onboardingData: OnboardingData | null;
  isOnboardingComplete: boolean;
  dashboardData: DashboardResponse | null;
  currentStage: number;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  setOnboardingData: (data: OnboardingData) => void;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  updateProfile: (data: OnboardingData) => Promise<void>;
  checkOnboardingStatus: () => Promise<boolean>;
  fetchDashboard: (force?: boolean) => Promise<void>;
  clearError: () => void;
  invalidateCache: () => void;
}

export const useProfileStore = create<ProfileState>(
  persist(
    (set, get) => ({
      onboardingData: null,
      isOnboardingComplete: false,
      dashboardData: null,
      currentStage: 1,
      isLoading: false,
      error: null,
      lastFetchTime: null,

  setOnboardingData: (data) => set({ onboardingData: data }),

  completeOnboarding: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await onboardingApi.completeOnboarding(data);
      set({
        onboardingData: data,
        isOnboardingComplete: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Onboarding failed',
        isLoading: false,
      });
      throw error;
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await onboardingApi.updateProfile(data);
      // Refresh dashboard to get updated profile and stage
      const dashboardData = await dashboardApi.getDashboard();
      set({
        onboardingData: data,
        dashboardData,
        currentStage: getStageNumber(dashboardData.stage?.current_stage || 'STAGE_1_PROFILE'),
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Profile update failed',
        isLoading: false,
      });
      throw error;
    }
  },

  checkOnboardingStatus: async () => {
    set({ isLoading: true });
    try {
      const status = await onboardingApi.getOnboardingStatus();
      const isComplete = status.onboarding_completed;
      set({
        isOnboardingComplete: isComplete,
        isLoading: false,
      });
      return isComplete;
    } catch (error: any) {
      set({ isLoading: false, isOnboardingComplete: false });
      return false;
    }
  },

  fetchDashboard: async (force = false) => {
    const state = get();
    const now = Date.now();
    
    // Use cached data if available and not expired
    if (!force && state.dashboardData && state.lastFetchTime) {
      const timeSinceLastFetch = now - state.lastFetchTime;
      if (timeSinceLastFetch < CACHE_DURATION) {
        return; // Return cached data
      }
    }

    set({ isLoading: true });
    try {
      const data = await dashboardApi.getDashboard();
      set({
        dashboardData: data,
        currentStage: getStageNumber(data.stage?.current_stage || 'STAGE_1_PROFILE'),
        isOnboardingComplete: data.stage?.onboarding_completed || false,
        isLoading: false,
        lastFetchTime: now,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch dashboard',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  
  invalidateCache: () => set({ lastFetchTime: null }),
    }),
    {
      name: 'profile-storage',
      partialize: (state) => ({
        dashboardData: state.dashboardData,
        currentStage: state.currentStage,
        isOnboardingComplete: state.isOnboardingComplete,
        lastFetchTime: state.lastFetchTime,
      }),
    }
  )
);
