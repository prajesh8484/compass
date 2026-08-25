/**
 * Project Repository — data access layer
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
  Settings,
} from '../lib/types';

export const projectRepository = {
  async getSettings(): Promise<Settings> {
    return invoke<Settings>('get_settings');
  },

  async setSetting(key: string, value: string): Promise<void> {
    return invoke<void>('set_setting', { key, value });
  },

  async getAll(): Promise<Project[]> {
    return invoke<Project[]>('get_projects');
  },

  async create(payload: CreateProjectPayload): Promise<Project> {
    return invoke<Project>('create_project', { payload });
  },

  async update(payload: UpdateProjectPayload): Promise<void> {
    return invoke<void>('update_project', { payload });
  },

  async delete(id: string): Promise<void> {
    return invoke<void>('delete_project', { id });
  },
};
