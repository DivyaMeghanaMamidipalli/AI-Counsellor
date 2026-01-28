import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { universitiesApi, University, UniversityRecommendations } from '../api/universities';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache for universities

interface UniversitiesState {
  recommendations: UniversityRecommendations | null;
  shortlisted: University[];
  locked: University[];
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  fetchAll: (force?: boolean) => Promise<void>;
  shortlistUniversity: (universityId: number) => Promise<void>;
  lockUniversity: (universityId: number) => Promise<void>;
  unlockUniversity: (universityId: number) => Promise<void>;
  removeFromShortlist: (universityId: number) => Promise<void>;
  invalidateCache: () => void;
}

export const useUniversitiesStore = create<UniversitiesState>(
  persist(
    (set, get) => ({
      recommendations: null,
      shortlisted: [],
      locked: [],
      isLoading: false,
      error: null,
      lastFetchTime: null,

      fetchAll: async (force = false) => {
        const state = get();
        const now = Date.now();

        // Use cached data if available and not expired
        if (!force && state.recommendations && state.lastFetchTime) {
          const timeSinceLastFetch = now - state.lastFetchTime;
          if (timeSinceLastFetch < CACHE_DURATION) {
            return; // Return cached data
          }
        }

        set({ isLoading: true, error: null });
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
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Failed to load universities',
            isLoading: false,
          });
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
          await universitiesApi.unlockUniversity(universityId);
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
