import { create } from 'zustand';
import { tasksApi, Task } from '../api/tasks';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache for tasks - increased from 3

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;
  fetchInProgress: boolean; // Prevent concurrent fetches

  fetchTasks: (force?: boolean) => Promise<void>;
  updateTask: (taskId: number, status: string) => Promise<void>;
  createTask: (title: string, description?: string) => Promise<void>;
  generateDefaultTasks: () => Promise<void>;
  invalidateCache: () => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  lastFetchTime: null,
  fetchInProgress: false,

  fetchTasks: async (force = false) => {
    const state = get();
    const now = Date.now();

    // Prevent concurrent fetch requests
    if (state.fetchInProgress) {
      return;
    }

    // Use cached data if available and not expired
    if (!force && state.tasks.length > 0 && state.lastFetchTime) {
      const timeSinceLastFetch = now - state.lastFetchTime;
      if (timeSinceLastFetch < CACHE_DURATION) {
        return; // Return cached data
      }
    }

    set({ isLoading: true, error: null, fetchInProgress: true });
    try {
      const tasks = await tasksApi.getAllTasks();
      set({
        tasks,
        isLoading: false,
        lastFetchTime: now,
        fetchInProgress: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load tasks',
        isLoading: false,
        fetchInProgress: false,
      });
    }
  },

  updateTask: async (taskId: number, status: string) => {
    try {
      await tasksApi.updateTask(taskId, { status });
      // Optimistic update
      const state = get();
      set({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, status } : task
        ),
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update task' });
      throw error;
    }
  },

  createTask: async (title: string, description?: string) => {
    try {
      const newTask = await tasksApi.createTask(title, description);
      const state = get();
      set({
        tasks: [...state.tasks, newTask],
        lastFetchTime: null, // Invalidate cache
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create task' });
      throw error;
    }
  },

  generateDefaultTasks: async () => {
    try {
      await tasksApi.generateDefaultTasks();
      // Invalidate cache and refetch
      set({ lastFetchTime: null });
      await get().fetchTasks(true);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to generate tasks' });
      throw error;
    }
  },

  invalidateCache: () => set({ lastFetchTime: null }),
}));
