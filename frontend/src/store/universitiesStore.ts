import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { universitiesApi, University, UniversityRecommendations } from '../api/universities';

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache for universities - increased from 10

interface UniversitiesState {
  recommendations: UniversityRecommendations | null;
  shortlisted: University[];
  locked: University[];
  allUniversities: University[];
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;
  fetchInProgress: boolean; // Prevent concurrent fetches

  fetchAll: (force?: boolean) => Promise<void>;
  fetchAllUniversities: () => Promise<void>;
  shortlistUniversity: (universityId: number) => Promise<void>;
  lockUniversity: (universityId: number) => Promise<void>;
  unlockUniversity: (universityId: number) => Promise<string | null>;
  removeFromShortlist: (universityId: number) => Promise<void>;
  invalidateCache: () => void;
}

export const useUniversitiesStore = create<UniversitiesState>(
  persist(
    (set, get) => ({
      recommendations: null,
      shortlisted: [],
      locked: [],
      allUniversities: [],
      isLoading: false,
      error: null,
      lastFetchTime: null,
      fetchInProgress: false,

      fetchAll: async (force = false) => {
        const state = get();
        const now = Date.now();

        // Prevent concurrent fetch requests
        if (state.fetchInProgress) {
          return;
        }

        // Use cached data if available and not expired
        if (!force && state.recommendations && state.lastFetchTime) {
          const timeSinceLastFetch = now - state.lastFetchTime;
          if (timeSinceLastFetch < CACHE_DURATION) {
            return; // Return cached data
          }
        }

        set({ isLoading: true, error: null, fetchInProgress: true });
        try {
          const [recs, short, lock] = await Promise.all([
            universitiesApi.getRecommendations(),
            universitiesApi.getShortlisted(),
            universitiesApi.getLocked(),
          ]);
          set({
            recommendations: recs,
            shortlisted: short,
            locked: lock,
            isLoading: false,
            lastFetchTime: now,
            fetchInProgress: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Failed to load universities',
            isLoading: false,
            fetchInProgress: false,
          });
        }
      },

      fetchAllUniversities: async () => {
        try {
          const universities = await universitiesApi.getAllUniversities();
          set({ allUniversities: universities });
        } catch (error: any) {
          console.error('Failed to fetch all universities:', error);
        }
      },

      shortlistUniversity: async (universityId: number) => {
        try {
          await universitiesApi.shortlistUniversity(universityId, 'Target');
          // Optimistic update: move from recommendations to shortlisted
          const state = get();
          const university = [
            ...(state.recommendations?.dream || []),
            ...(state.recommendations?.target || []),
            ...(state.recommendations?.safe || []),
          ].find((u) => u.id === universityId);

          if (university) {
            set({
              shortlisted: [...state.shortlisted, university],
              lastFetchTime: null, // Invalidate cache for next fetch
            });
          }
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to shortlist university' });
          throw error;
        }
      },

      lockUniversity: async (universityId: number) => {
        try {
          await universitiesApi.lockUniversity(universityId);
          // Optimistic update: move from shortlisted to locked
          const state = get();
          const university = state.shortlisted.find((u) => u.id === universityId);

          if (university) {
            set({
              shortlisted: state.shortlisted.filter((u) => u.id !== universityId),
              locked: [...state.locked, { ...university, is_locked: true }],
              lastFetchTime: null, // Invalidate cache
            });
          }
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to lock university' });
          throw error;
        }
      },

      unlockUniversity: async (universityId: number) => {
        try {
          const response = await universitiesApi.unlockUniversity(universityId);
          // Optimistic update: move from locked to shortlisted
          const state = get();
          const university = state.locked.find((u) => u.id === universityId);

          if (university) {
            set({
              locked: state.locked.filter((u) => u.id !== universityId),
              shortlisted: [...state.shortlisted, { ...university, is_locked: false }],
              lastFetchTime: null, // Invalidate cache
            });
          }
          return response.warning ?? null;
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to unlock university' });
          throw error;
        }
      },

      removeFromShortlist: async (universityId: number) => {
        try {
          await universitiesApi.removeFromShortlist(universityId);
          // Optimistic update: remove from shortlisted
          const state = get();
          set({
            shortlisted: state.shortlisted.filter((u) => u.id !== universityId),
            lastFetchTime: null, // Invalidate cache
          });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to remove from shortlist' });
          throw error;
        }
      },

      invalidateCache: () => set({ lastFetchTime: null }),
    }),
    {
      name: 'universities-storage',
      partialize: (state) => ({
        recommendations: state.recommendations,
        shortlisted: state.shortlisted,
        locked: state.locked,
        lastFetchTime: state.lastFetchTime,
      }),
    }
  )
);
