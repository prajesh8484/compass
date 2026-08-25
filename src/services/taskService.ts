/**
 * Task Service — business logic layer
 *
 * Enforces business rules that go beyond simple CRUD.
 * Never imports from React. Never writes directly to stores.
 */

import { taskRepository } from '../repositories/taskRepository';
import { rankTasks, type RankedResult } from '../lib/priorityEngine';
import type { CreateTaskPayload, Task, ScoringContext } from '../lib/types';

export const taskService = {
  /**
   * Create a new task and return it.
   * Validates that importance is within range.
   */
  async createTask(payload: CreateTaskPayload): Promise<Task> {
    if (payload.importance !== undefined) {
      if (payload.importance < 1 || payload.importance > 10) {
        throw new Error('Importance must be between 1 and 10');
      }
    }
    return taskRepository.create(payload);
  },

  /**
   * Load all active tasks and re-rank them in memory.
   * Returns the full ranked result for the UI.
   */
  async refreshPriorities(
    context: ScoringContext,
    projectHealthMap: Map<string, number> = new Map(),
  ): Promise<RankedResult> {
    const tasks = await taskRepository.getActive();
    return rankTasks(tasks, context, projectHealthMap);
  },

  async getCompletedTasks(): Promise<Task[]> {
    return taskRepository.getCompleted();
  },

  /**
   * Complete a task. Refuses to complete blocked tasks.
   * Accepts both raw Task[] and in-memory ScoredTask[] from the store.
   */
  async completeTask(taskId: string, allTasks: Pick<Task, 'id' | 'status' | 'depends_on'>[]): Promise<void> {
    const task = allTasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');

    const completedIds = new Set(
      allTasks.filter((t) => t.status === 'done').map((t) => t.id),
    );
    const isBlocked = task.depends_on.some((depId) => !completedIds.has(depId));
    if (isBlocked) {
      throw new Error('Cannot complete a task while it has incomplete dependencies');
    }

    await taskRepository.complete(taskId);
  },

  /**
   * Reopen a completed task, setting status back to 'todo'.
   */
  async reopenTask(taskId: string): Promise<void> {
    await taskRepository.update({
      id: taskId,
      status: 'todo',
    });
  },
};
