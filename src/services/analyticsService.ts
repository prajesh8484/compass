/**
 * Analytics Service — derived completion metrics.
 *
 * Pure functions over completed tasks. Nothing here touches storage.
 * All inputs come from the repositories; all outputs are computed in memory.
 */

import type { Task } from '../lib/types';

export interface DayVelocity {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  label: string;
  count: number;
}

export interface TopicSlice {
  key: string;
  count: number;
}

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function completionDate(task: Task): Date | null {
  const raw = task.completed_at ?? null;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Completed-task counts for each of the last `days` days, oldest → newest.
 */
export function computeVelocity(completedTasks: Task[], days = 7, now = new Date()): DayVelocity[] {
  const counts = new Map<string, number>();
  for (const task of completedTasks) {
    const d = completionDate(task);
    if (!d) continue;
    const key = toDayKey(d);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const result: DayVelocity[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = toDayKey(d);
    result.push({
      date: key,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      count: counts.get(key) ?? 0,
    });
  }
  return result;
}

/**
 * Consecutive active days ending today (or yesterday, so a streak
 * isn't "broken" before the user has worked today).
 */
export function computeStreak(completedTasks: Task[], now = new Date()): number {
  const activeDays = new Set<string>();
  for (const task of completedTasks) {
    const d = completionDate(task);
    if (d) activeDays.add(toDayKey(d));
  }

  const cursor = new Date(now);
  if (!activeDays.has(toDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!activeDays.has(toDayKey(cursor))) return 0;
  }

  let streak = 0;
  while (activeDays.has(toDayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Completed-task distribution grouped by project + section ("Project / Section").
 */
export function computeTopicDistribution(
  completedTasks: Task[],
  projectNameById: Map<string, string>,
): TopicSlice[] {
  const counts = new Map<string, number>();
  for (const task of completedTasks) {
    const project = projectNameById.get(task.project_id) ?? 'Unknown';
    const key = task.section ? `${project} / ${task.section}` : project;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}
