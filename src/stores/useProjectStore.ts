/**
 * Project Store — Zustand UI state for projects and vault
 */

import { create } from 'zustand';
import { projectService } from '../services/projectService';
import type { Project, CreateProjectPayload, Settings } from '../lib/types';

interface ProjectState {
  projects: Project[];
  settings: Settings | null;
  activeProjectId: string | null;
  isLoading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  loadProjects: () => Promise<void>;
  createProject: (payload: CreateProjectPayload) => Promise<Project>;
  setActiveProject: (id: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  settings: null,
  activeProjectId: null,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    const settings = await projectService.getSettings();
    set({ settings, activeProjectId: settings.last_active_project_id || null });
  },

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await projectService.getAllProjects();
      set({ projects, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  createProject: async (payload) => {
    const project = await projectService.createProject(payload);
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  setActiveProject: (id) => {
    set({ activeProjectId: id });
    if (id) projectService.setLastActiveProject(id);
  },
}));
