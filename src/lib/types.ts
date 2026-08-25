// ─────────────────────────────────────────
// Shared TypeScript model types
// Must stay in sync with src-tauri/src/models/mod.rs
// ─────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'very_hard';

export interface Task {
  id: string;
  project_id: string;
  section: string;
  title: string;
  description: string;
  status: TaskStatus;
  importance: number; // 1–10
  deadline: string | null;
  estimated_minutes: number | null;
  difficulty: Difficulty;
  manual_boost: boolean;
  pinned: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  last_worked_at: string | null;
  depends_on: string[]; // task IDs
}

export interface CreateTaskPayload {
  project_id: string;
  section?: string;
  title: string;
  description?: string;
  importance?: number;
  deadline?: string;
  estimated_minutes?: number;
  difficulty?: Difficulty;
  depends_on?: string[];
}

export interface UpdateTaskPayload {
  id: string;
  section?: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  importance?: number;
  deadline?: string | null;
  estimated_minutes?: number | null;
  difficulty?: Difficulty;
  manual_boost?: boolean;
  pinned?: boolean;
  depends_on?: string[];
}

export interface Project {
  id: string;
  name: string;
  folder_path: string;
  color: string;
  created_at: string;
  last_active_at: string;
  health_score: number;
}

export interface CreateProjectPayload {
  name: string;
  folder_path?: string;
  color?: string;
}

export interface UpdateProjectPayload {
  id: string;
  name?: string;
  color?: string;
  last_active_at?: string;
  health_score?: number;
}

export interface Settings {
  last_active_project_id: string;
  has_completed_onboarding?: string;
}

// ─────────────────────────────────────────
// Priority Engine types
// ─────────────────────────────────────────

export interface ScoreBreakdown {
  importance: number;
  deadline: number;
  estimatedTime: number;
  difficulty: number;
  projectHealth: number;
  manualBoost: number;
  longTerm: number;
  aging: number;
  context: number;
  total: number;
}

export interface ScoredTask extends Task {
  /** Computed in memory by the Priority Engine. Never stored in SQLite. */
  priority_score: number;
  breakdown: ScoreBreakdown;
  isBlocked: boolean;
}

export interface ScoringContext {
  now: Date;
  activeProjectId: string | null;
  completedTaskIds: Set<string>;
}
