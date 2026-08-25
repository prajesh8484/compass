/**
 * Task Store — Zustand UI state
 *
 * This store owns:
 * - The ranked ScoredTask list (computed in memory by the Priority Engine)
 * - The full RankedResult (focus, todaysQueue, quickWins)
 * - Loading / error state
 *
 * Rules:
 * - Calls services, never repositories directly.
 * - Never imports React lifecycle hooks.
 * - Priority scores exist only here and in the Priority Engine.
 *   They are NEVER written back to SQLite.
 */

import { create } from 'zustand';
import { taskService } from '../services/taskService';
import { taskRepository } from '../repositories/taskRepository';
import type {
  CreateTaskPayload,
  UpdateTaskPayload,
  ScoredTask,
  ScoringContext,
  Task,
} from '../lib/types';
import type { RankedResult } from '../lib/priorityEngine';

interface TaskState {
  /** All active tasks, scored and ranked in memory by the Priority Engine. */
  tasks: ScoredTask[];
  ranked: RankedResult | null;
  isLoading: boolean;
  error: string | null;

  refresh: (context: ScoringContext, healthMap?: Map<string, number>) => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<Task>;
  updateTask: (payload: UpdateTaskPayload) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  reopenTask: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  pinTask: (id: string, pinned: boolean) => Promise<void>;
  startTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  forceRefresh: () => Promise<void>;
  bulkComplete: (ids: string[]) => Promise<void>;
  bulkArchive: (ids: string[]) => Promise<void>;
  bulkReassignSection: (ids: string[], section: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  ranked: null,
  isLoading: false,
  error: null,

  /** Load tasks from DB and run the Priority Engine in memory. */
  refresh: async (context, healthMap = new Map()) => {
    set({ isLoading: true, error: null });
    try {
      const result = await taskService.refreshPriorities(context, healthMap);
      set({ tasks: result.ranked, ranked: result, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  /**
   * Create a task and re-run the Priority Engine so the new task
   * immediately appears at the correct rank without a full page reload.
   */
  createTask: async (payload) => {
    const task = await taskService.createTask(payload);
    const { ranked } = get();
    const context: ScoringContext = {
      now: new Date(),
      activeProjectId: null,
      completedTaskIds: new Set(
        (ranked?.ranked ?? []).filter((t) => t.status === 'done').map((t) => t.id),
      ),
    };
    await get().refresh(context);
    return task;
  },

  /** Re-fetch all tasks without needing context passed from UI (useful for global events) */
  forceRefresh: async () => {
    const { ranked } = get();
    const context: ScoringContext = {
      now: new Date(),
      activeProjectId: null,
      completedTaskIds: new Set(
        (ranked?.ranked ?? []).filter((t) => t.status === 'done').map((t) => t.id),
      ),
    };
    await get().refresh(context);
  },

  /** Update a task's source fields, then re-rank so scores stay accurate. */
  updateTask: async (payload) => {
    await taskRepository.update(payload);
    const { ranked } = get();
    const context: ScoringContext = {
      now: new Date(),
      activeProjectId: null,
      completedTaskIds: new Set(
        (ranked?.ranked ?? []).filter((t) => t.status === 'done').map((t) => t.id),
      ),
    };
    await get().refresh(context);
  },

  completeTask: async (id) => {
    const { tasks } = get();
    await taskService.completeTask(id, tasks);
    // Remove from active list immediately (optimistic), then re-score.
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },

  reopenTask: async (id) => {
    await taskService.reopenTask(id);
    await get().forceRefresh();
  },

  archiveTask: async (id) => {
    await taskRepository.archive(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },

  pinTask: async (id, pinned) => {
    await taskRepository.pin(id, pinned);
    // Pinned flag is display-only — re-score to re-sort pinned to front.
    const { ranked } = get();
    const context: ScoringContext = {
      now: new Date(),
      activeProjectId: null,
      completedTaskIds: new Set(
        (ranked?.ranked ?? []).filter((t) => t.status === 'done').map((t) => t.id),
      ),
    };
    await get().refresh(context);
  },

  startTask: async (id) => {
    const { tasks } = get();
    const target = tasks.find((t) => t.id === id);
    if (target?.status === 'in_progress') {
      await taskRepository.update({ id, status: 'todo' });
    } else {
      await taskRepository.setLastWorked(id);
      await taskRepository.update({ id, status: 'in_progress' });
    }
    await get().forceRefresh();
  },

  deleteTask: async (id) => {
    await taskRepository.delete(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },

  bulkComplete: async (ids) => {
    const { tasks } = get();
    for (const id of ids) {
      try {
        await taskService.completeTask(id, tasks);
      } catch {
        // Skip blocked tasks
      }
    }
    await get().forceRefresh();
  },

  bulkArchive: async (ids) => {
    for (const id of ids) {
      await taskRepository.archive(id);
    }
    await get().forceRefresh();
  },

  bulkReassignSection: async (ids, section) => {
    for (const id of ids) {
      await taskRepository.update({ id, section });
    }
    await get().forceRefresh();
  },

  bulkDelete: async (ids) => {
    for (const id of ids) {
      await taskRepository.delete(id);
    }
    await get().forceRefresh();
  },
}));
