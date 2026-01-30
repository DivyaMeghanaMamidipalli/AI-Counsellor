import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    // Longer cache times to reduce API calls
    staleTime: 10 * 60 * 1000, // 10 minutes - increased from 5
    // Keep unused data in cache for 30 minutes
    gcTime: 30 * 60 * 1000, // increased from 10
    // Retry failed requests 2 times (reduced from 3)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Deduplicate identical requests within 5 seconds
    dedupeInterval: 5000,
  },
  mutations: {
    // Retry mutations 1 time on failure
    retry: 1,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});
