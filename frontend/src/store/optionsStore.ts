import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/client';

interface UniversityOptions {
  field_options: string[];
  country_options: string[];
  education_levels: string[];
  budget_ranges: string[];
  funding_types: string[];
  exam_statuses: string[];
}

interface OptionsState {
  options: UniversityOptions | null;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  fetchOptions: (force?: boolean) => Promise<void>;
  invalidateCache: () => void;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour - static data rarely changes

export const useOptionsStore = create<OptionsState>(
  persist(
    (set, get) => ({
      options: null,
      isLoading: false,
      error: null,
      lastFetchTime: null,

      fetchOptions: async (force = false) => {
        const state = get();
        const now = Date.now();

        // Return cached data if fresh
        if (!force && state.options && state.lastFetchTime) {
          const timeSinceLastFetch = now - state.lastFetchTime;
          if (timeSinceLastFetch < CACHE_DURATION) {
            return;
          }
        }

        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get('/universities/options');
          set({
            options: response.data,
            isLoading: false,
            lastFetchTime: now,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || 'Failed to load options',
            isLoading: false,
          });
          throw error;
        }
      },

      invalidateCache: () => set({ lastFetchTime: null }),
    }),
    {
      name: 'options-storage',
      partialize: (state) => ({
        options: state.options,
        lastFetchTime: state.lastFetchTime,
      }),
    }
  )
);
