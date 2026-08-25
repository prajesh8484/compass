/**
 * Project Service — business logic for projects and vault management
 */

import { projectRepository } from '../repositories/projectRepository';
import type { CreateProjectPayload, Project, Settings } from '../lib/types';

export const projectService = {
  async getSettings(): Promise<Settings> {
    return projectRepository.getSettings();
  },

  async setLastActiveProject(id: string): Promise<void> {
    await projectRepository.setSetting('last_active_project_id', id);
  },

  async getAllProjects(): Promise<Project[]> {
    return projectRepository.getAll();
  },

  /**
   * Create a project in SQLite. Zero auto-generated markdown dumping.
   */
  async createProject(payload: CreateProjectPayload): Promise<Project> {
    return projectRepository.create(payload);
  },

  /**
   * Compute project health score based on neglect signals.
   * Returns a score in: 0 (healthy), 5, 12, 20, 30 (critical)
   */
  computeHealthScore(project: Project, openTaskCount: number, overdueTaskCount: number): number {
    const now = Date.now();
    const lastActive = new Date(project.last_active_at).getTime();
    const daysSinceActive = (now - lastActive) / (1000 * 60 * 60 * 24);

    let score = 0;

    if (overdueTaskCount > 0) score += 10;
    if (openTaskCount > 10)   score += 5;
    if (daysSinceActive > 30) score += 15;
    else if (daysSinceActive > 14) score += 8;
    else if (daysSinceActive > 7)  score += 3;

    // Clamp to defined tiers
    if (score >= 25) return 30;
    if (score >= 18) return 20;
    if (score >= 10) return 12;
    if (score >= 5)  return 5;
    return 0;
  },
};
