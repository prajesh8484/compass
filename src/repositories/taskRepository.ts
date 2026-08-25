/**
 * Task Repository — data access layer
 *
 * All calls to Tauri commands go through here.
 * This is the only file allowed to call `invoke` for task-related operations.
 * Services and stores MUST go through this interface.
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '../lib/types';

export const taskRepository = {
  async getAll(): Promise<Task[]> {
    return invoke<Task[]>('get_tasks', { projectId: null });
  },

  async getByProject(projectId: string): Promise<Task[]> {
    return invoke<Task[]>('get_tasks', { projectId });
  },

  async getActive(): Promise<Task[]> {
    return invoke<Task[]>('get_active_tasks');
  },

  async getCompleted(): Promise<Task[]> {
    const all = await invoke<Task[]>('get_tasks', { projectId: null });
    return all.filter((t) => t.status === 'done');
  },

  async create(payload: CreateTaskPayload): Promise<Task> {
    return invoke<Task>('create_task', { payload });
  },

  async update(payload: UpdateTaskPayload): Promise<void> {
    return invoke<void>('update_task', { payload });
  },

  async complete(id: string): Promise<void> {
    return invoke<void>('complete_task', { id });
  },

  async archive(id: string): Promise<void> {
    return invoke<void>('archive_task', { id });
  },

  async unarchive(id: string): Promise<void> {
    return invoke<void>('update_task', { payload: { id, archived: false } });
  },

  async pin(id: string, pinned: boolean): Promise<void> {
    return invoke<void>('pin_task', { id, pinned });
  },

  async setLastWorked(id: string): Promise<void> {
    return invoke<void>('set_last_worked', { id });
  },

  async delete(id: string): Promise<void> {
    return invoke<void>('delete_task', { id });
  },
};
