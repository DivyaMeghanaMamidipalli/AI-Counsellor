import { useQuery } from '@tanstack/react-query';
import * as universitiesApi from '../api/universities';

export const useGetUniversities = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
}) => {
  return useQuery({
    queryKey: ['universities', params],
    queryFn: () => universitiesApi.getUniversities(params),
    staleTime: 30 * 60 * 1000, // 30 minutes - universities data changes infrequently
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useGetUniversityById = (id: string) => {
  return useQuery({
    queryKey: ['universities', id],
    queryFn: () => universitiesApi.getUniversityById(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  });
};
