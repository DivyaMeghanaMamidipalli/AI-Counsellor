import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as tasksApi from '../api/tasks';

export const useGetTasks = (stage?: string) => {
  return useQuery({
    queryKey: ['tasks', stage],
    queryFn: () => tasksApi.getTasks(stage),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useGetTaskById = (taskId: string) => {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => tasksApi.getTaskById(taskId),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCompleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
