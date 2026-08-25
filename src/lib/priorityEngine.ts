/**
 * Priority Engine — Version 1
 *
 * A pure, deterministic scoring function.
 * No imports from React, Tauri, or any side-effectful module.
 *
 * Given the same tasks and context, this function always produces the same ordering.
 * Built to handle 100,000 tasks without performance concerns.
 *
 * See: docs/PRIORITY_ENGINE.md for the full specification.
 */

import type { Task, ScoredTask, ScoringContext, ScoreBreakdown } from './types';
import { PRIORITY_CONFIG } from '../config/priorityConfig';
import { APP_CONSTANTS } from '../config/constants';

// ─────────────────────────────────────────
// Individual scoring components
// ─────────────────────────────────────────

/** Importance × 4 → range 4–40 */
function scoreImportance(importance: number): number {
  return Math.max(1, Math.min(10, importance)) * PRIORITY_CONFIG.importanceMultiplier;
}

/**
 * Deadline weight — exponential urgency.
 * Distant deadlines have very little influence.
 * As deadlines approach, their contribution rapidly increases.
 */
function scoreDeadline(deadline: string | null, now: Date): number {
  if (!deadline) return 0;

  const due = new Date(deadline);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0)    return PRIORITY_CONFIG.deadline.overdue;
  if (diffDays < 1)    return PRIORITY_CONFIG.deadline.today;
  if (diffDays < 2)    return PRIORITY_CONFIG.deadline.tomorrow;
  if (diffDays < 7)    return PRIORITY_CONFIG.deadline.threeDays;
  if (diffDays < 14)   return PRIORITY_CONFIG.deadline.week;
  if (diffDays < 30)   return PRIORITY_CONFIG.deadline.month;
  return PRIORITY_CONFIG.deadline.future;
}

/**
 * Estimated time bonus.
 * Short tasks provide momentum and quick wins.
 * Very long tasks receive a small penalty.
 */
function scoreEstimatedTime(estimatedMinutes: number | null): number {
  if (estimatedMinutes === null) return 0; // Unknown — neutral

  if (estimatedMinutes <= 10)  return PRIORITY_CONFIG.estimatedTime.under10m;
  if (estimatedMinutes <= 30)  return PRIORITY_CONFIG.estimatedTime.under30m;
  if (estimatedMinutes <= 60)  return PRIORITY_CONFIG.estimatedTime.under1h;
  if (estimatedMinutes <= 180) return PRIORITY_CONFIG.estimatedTime.under3h;
  if (estimatedMinutes <= 360) return PRIORITY_CONFIG.estimatedTime.under6h;
  return PRIORITY_CONFIG.estimatedTime.over6h;
}

/**
 * Difficulty bonus/penalty.
 * Easy tasks provide momentum. Hard tasks are naturally surfaced by deadline/importance.
 */
function scoreDifficulty(difficulty: Task['difficulty']): number {
  switch (difficulty) {
    case 'easy':      return PRIORITY_CONFIG.difficulty.easy;
    case 'medium':    return PRIORITY_CONFIG.difficulty.medium;
    case 'hard':      return PRIORITY_CONFIG.difficulty.hard;
    case 'very_hard': return PRIORITY_CONFIG.difficulty.very_hard;
  }
}

/**
 * Manual boost — user explicitly flagged this task as urgent.
 * Always overrides automatic suggestions when combined with high importance.
 */
function scoreManualBoost(manualBoost: boolean): number {
  return manualBoost ? PRIORITY_CONFIG.manualBoost : 0;
}

/**
 * Long-term tasks without deadlines slowly rise over time.
 * Prevents forgotten goals from staying buried forever.
 * Maximum bonus: +20 (after ~140 days)
 */
function scoreLongTerm(task: Task, now: Date): number {
  if (task.deadline) return 0; // Only applies to deadline-less tasks
  if (task.status === 'done' || task.archived) return 0;

  const created = new Date(task.created_at);
  const ageDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  const bonus = Math.floor(ageDays / PRIORITY_CONFIG.longTerm.daysPerTick) * PRIORITY_CONFIG.longTerm.bonusPerTick;
  return Math.min(PRIORITY_CONFIG.longTerm.maxBonus, bonus);
}

/**
 * Aging bonus — tasks that have been incomplete for a long time
 * receive a small, capped increase to prevent permanent backlog.
 */
function scoreAging(task: Task, now: Date): number {
  if (task.status === 'done' || task.archived) return 0;

  const created = new Date(task.created_at);
  const ageDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

  if (ageDays >= 60) return PRIORITY_CONFIG.aging.twoMonths;
  if (ageDays >= 30) return PRIORITY_CONFIG.aging.oneMonth;
  if (ageDays >= 14) return PRIORITY_CONFIG.aging.twoWeeks;
  if (ageDays >= 7)  return PRIORITY_CONFIG.aging.oneWeek;
  return 0;
}

/**
 * Context bonus — tasks in the currently active project.
 * Reduces cognitive context-switching cost.
 * Bonus disappears automatically when user switches projects.
 */
function scoreContext(task: Task, activeProjectId: string | null): number {
  if (!activeProjectId) return 0;
  return task.project_id === activeProjectId ? PRIORITY_CONFIG.contextBonus : 0;
}

/**
 * Project health contribution.
 * Neglected projects gradually surface their tasks.
 * This encourages finishing existing work before starting new projects.
 */
function scoreProjectHealth(healthScore: number): number {
  // healthScore is 0 (healthy), 5, 12, 20, 30
  return Math.max(0, healthScore);
}

/**
 * Check if a task is blocked by incomplete dependencies.
 * Blocked tasks receive a score of 0 and are excluded from focus recommendations.
 */
function isTaskBlocked(task: Task, completedTaskIds: Set<string>): boolean {
  if (!task.depends_on || task.depends_on.length === 0) return false;
  return task.depends_on.some((depId) => !completedTaskIds.has(depId));
}

// ─────────────────────────────────────────
// Final score computation
// ─────────────────────────────────────────

export function computeScore(
  task: Task,
  context: ScoringContext,
  projectHealthScore: number = 0,
): ScoredTask {
  const blocked = isTaskBlocked(task, context.completedTaskIds);

  if (
    blocked ||
    task.status === 'done' ||
    task.status === 'archived' ||
    task.archived
  ) {
    const breakdown: ScoreBreakdown = {
      importance: 0, deadline: 0, estimatedTime: 0, difficulty: 0,
      projectHealth: 0, manualBoost: 0, longTerm: 0, aging: 0, context: 0,
      total: 0,
    };
    return { ...task, priority_score: 0, breakdown, isBlocked: blocked };
  }

  const importance    = scoreImportance(task.importance);
  const deadline      = scoreDeadline(task.deadline, context.now);
  const estimatedTime = scoreEstimatedTime(task.estimated_minutes);
  const difficulty    = scoreDifficulty(task.difficulty);
  const projectHealth = scoreProjectHealth(projectHealthScore);
  const manualBoost   = scoreManualBoost(task.manual_boost);
  const longTerm      = scoreLongTerm(task, context.now);
  const aging         = scoreAging(task, context.now);
  const ctx           = scoreContext(task, context.activeProjectId);

  const total =
    importance +
    deadline +
    estimatedTime +
    difficulty +
    projectHealth +
    manualBoost +
    longTerm +
    aging +
    ctx;

  const breakdown: ScoreBreakdown = {
    importance, deadline, estimatedTime, difficulty,
    projectHealth, manualBoost, longTerm, aging, context: ctx,
    total,
  };

  return {
    ...task,
    priority_score: total,
    breakdown,
    isBlocked: false,
  };
}

// ─────────────────────────────────────────
// Tie-breaking comparator
// ─────────────────────────────────────────

function compareTasks(a: ScoredTask, b: ScoredTask): number {
  if (b.priority_score !== a.priority_score) {
    return b.priority_score - a.priority_score;
  }
  if (a.deadline !== b.deadline) {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  }
  if (b.importance !== a.importance) return b.importance - a.importance;
  if (a.estimated_minutes !== b.estimated_minutes) {
    if (a.estimated_minutes === null) return 1;
    if (b.estimated_minutes === null) return -1;
    return a.estimated_minutes - b.estimated_minutes;
  }
  const aCreated = new Date(a.created_at).getTime();
  const bCreated = new Date(b.created_at).getTime();
  if (aCreated !== bCreated) return aCreated - bCreated;
  return a.title.localeCompare(b.title);
}

// ─────────────────────────────────────────
// Public API
// ─────────────────────────────────────────

export interface RankedResult {
  /** All active (non-done, non-archived) tasks sorted by priority */
  ranked: ScoredTask[];
  /** The single highest-priority non-blocked task */
  focus: ScoredTask | null;
  /** Top 7 tasks for Today's Queue */
  todaysQueue: ScoredTask[];
  /** Up to 3 quick wins (≤15 min, not blocked) */
  quickWins: ScoredTask[];
}

export function rankTasks(
  tasks: Task[],
  context: ScoringContext,
  projectHealthMap: Map<string, number> = new Map(),
): RankedResult {
  const scored: ScoredTask[] = tasks.map((task) =>
    computeScore(task, context, projectHealthMap.get(task.project_id) ?? 0),
  );

  // Pinned tasks surface first as a display-only sort — their score is unchanged.
  const active = scored.filter(
    (t) => t.status !== 'done' && t.status !== 'archived' && !t.archived,
  );

  const pinned   = active.filter((t) => t.pinned).sort(compareTasks);
  const unpinned = active.filter((t) => !t.pinned).sort(compareTasks);
  const ranked   = [...pinned, ...unpinned];

  const focus = ranked.find((t) => !t.isBlocked) ?? null;

  const todaysQueue = ranked.slice(0, APP_CONSTANTS.QUEUE_SIZE_LIMIT);

  const quickWins = ranked
    .filter(
      (t) =>
        !t.isBlocked &&
        t.estimated_minutes !== null &&
        t.estimated_minutes <= APP_CONSTANTS.QUICK_WIN_MAX_MINUTES &&
        t.priority_score > 0,
    )
    .slice(0, APP_CONSTANTS.QUICK_WINS_LIMIT);

  return { ranked, focus, todaysQueue, quickWins };
}
