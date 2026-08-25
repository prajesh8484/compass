/**
 * Priority Engine — Unit Tests
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import { computeScore, rankTasks } from './priorityEngine';
import type { Task, ScoringContext } from './types';

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

const NOW = new Date('2025-01-15T10:00:00Z');

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    project_id: 'proj-1',
    section: 'General',
    title: 'Test task',
    description: '',
    status: 'todo',
    importance: 5,
    deadline: null,
    estimated_minutes: null,
    difficulty: 'medium',
    manual_boost: false,
    pinned: false,
    archived: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    completed_at: null,
    last_worked_at: null,
    depends_on: [],
    ...overrides,
  };
}

function makeContext(overrides: Partial<ScoringContext> = {}): ScoringContext {
  return {
    now: NOW,
    activeProjectId: null,
    completedTaskIds: new Set(),
    ...overrides,
  };
}

// ─────────────────────────────────────────
// Importance
// ─────────────────────────────────────────

describe('Importance scoring', () => {
  it('scales importance × 4', () => {
    const task = makeTask({ importance: 10 });
    const { breakdown } = computeScore(task, makeContext());
    expect(breakdown.importance).toBe(40);
  });

  it('clamps at min 4 (importance 1)', () => {
    const task = makeTask({ importance: 1 });
    const { breakdown } = computeScore(task, makeContext());
    expect(breakdown.importance).toBe(4);
  });
});

// ─────────────────────────────────────────
// Deadline
// ─────────────────────────────────────────

describe('Deadline scoring', () => {
  it('gives +120 for overdue tasks', () => {
    const task = makeTask({ deadline: '2025-01-10T00:00:00Z' }); // 5 days ago
    const { breakdown } = computeScore(task, makeContext());
    expect(breakdown.deadline).toBe(120);
  });

  it('gives +90 for tasks due today', () => {
    const task = makeTask({ deadline: '2025-01-15T23:59:00Z' });
    const { breakdown } = computeScore(task, makeContext());
    expect(breakdown.deadline).toBe(90);
  });

  it('gives 0 for tasks with no deadline', () => {
    const task = makeTask({ deadline: null });
    const { breakdown } = computeScore(task, makeContext());
    expect(breakdown.deadline).toBe(0);
  });

  it('gives +2 for tasks due in 45 days', () => {
    const far = new Date(NOW);
    far.setDate(far.getDate() + 45);
    const task = makeTask({ deadline: far.toISOString() });
    const { breakdown } = computeScore(task, makeContext());
    expect(breakdown.deadline).toBe(2);
  });
});

// ─────────────────────────────────────────
// Estimated time
// ─────────────────────────────────────────

describe('Estimated time scoring', () => {
  it('gives +18 for ≤10 min tasks', () => {
    const task = makeTask({ estimated_minutes: 10 });
    const { breakdown } = computeScore(task, makeContext());
    expect(breakdown.estimatedTime).toBe(18);
  });

  it('gives -12 for >6h tasks', () => {
    const task = makeTask({ estimated_minutes: 420 });
    const { breakdown } = computeScore(task, makeContext());
    expect(breakdown.estimatedTime).toBe(-12);
  });

  it('gives 0 for unknown estimated time', () => {
    const task = makeTask({ estimated_minutes: null });
    const { breakdown } = computeScore(task, makeContext());
    expect(breakdown.estimatedTime).toBe(0);
  });
});

// ─────────────────────────────────────────
// Difficulty
// ─────────────────────────────────────────

describe('Difficulty scoring', () => {
  it('gives +6 for easy tasks', () => {
    const task = makeTask({ difficulty: 'easy' });
    const { breakdown } = computeScore(task, makeContext());
    expect(breakdown.difficulty).toBe(6);
  });

  it('gives -10 for very_hard tasks', () => {
    const task = makeTask({ difficulty: 'very_hard' });
    const { breakdown } = computeScore(task, makeContext());
    expect(breakdown.difficulty).toBe(-10);
  });
});

// ─────────────────────────────────────────
// Manual boost
// ─────────────────────────────────────────

describe('Manual boost', () => {
  it('adds +30 when manual_boost is true', () => {
    const task = makeTask({ manual_boost: true });
    const { breakdown } = computeScore(task, makeContext());
    expect(breakdown.manualBoost).toBe(30);
  });
});

// ─────────────────────────────────────────
// Blocked tasks
// ─────────────────────────────────────────

describe('Blocked tasks', () => {
  it('gives score 0 when dependency is incomplete', () => {
    const task = makeTask({ depends_on: ['dep-1'] });
    const ctx = makeContext({ completedTaskIds: new Set() });
    const result = computeScore(task, ctx);
    expect(result.priority_score).toBe(0);
    expect(result.isBlocked).toBe(true);
  });

  it('unblocks when dependency is completed', () => {
    const task = makeTask({ depends_on: ['dep-1'], importance: 8 });
    const ctx = makeContext({ completedTaskIds: new Set(['dep-1']) });
    const result = computeScore(task, ctx);
    expect(result.priority_score).toBeGreaterThan(0);
    expect(result.isBlocked).toBe(false);
  });
});

// ─────────────────────────────────────────
// Context bonus
// ─────────────────────────────────────────

describe('Context bonus', () => {
  it('adds +10 for same project', () => {
    const task = makeTask({ project_id: 'proj-1' });
    const ctx = makeContext({ activeProjectId: 'proj-1' });
    const { breakdown } = computeScore(task, ctx);
    expect(breakdown.context).toBe(10);
  });

  it('gives 0 for different project', () => {
    const task = makeTask({ project_id: 'proj-2' });
    const ctx = makeContext({ activeProjectId: 'proj-1' });
    const { breakdown } = computeScore(task, ctx);
    expect(breakdown.context).toBe(0);
  });
});

// ─────────────────────────────────────────
// Ranking
// ─────────────────────────────────────────

describe('rankTasks', () => {
  it('places pinned tasks before non-pinned', () => {
    const tasks: Task[] = [
      makeTask({ id: 'a', importance: 9, pinned: false }),
      makeTask({ id: 'b', importance: 1, pinned: true }),
    ];
    const { ranked } = rankTasks(tasks, makeContext());
    expect(ranked[0].id).toBe('b'); // pinned comes first
  });

  it('focus is the highest-ranked non-blocked task', () => {
    const tasks: Task[] = [
      makeTask({ id: 'blocked', importance: 10, depends_on: ['missing'] }),
      makeTask({ id: 'normal', importance: 7 }),
    ];
    const { focus } = rankTasks(tasks, makeContext());
    expect(focus?.id).toBe('normal');
  });

  it('quick wins contain only tasks ≤15 min', () => {
    const tasks: Task[] = [
      makeTask({ id: 'long', importance: 8, estimated_minutes: 120 }),
      makeTask({ id: 'quick', importance: 5, estimated_minutes: 10 }),
    ];
    const { quickWins } = rankTasks(tasks, makeContext());
    expect(quickWins.every((t) => (t.estimated_minutes ?? 0) <= 15)).toBe(true);
  });

  it('todaysQueue contains at most 7 tasks', () => {
    const tasks: Task[] = Array.from({ length: 20 }, (_, i) =>
      makeTask({ id: `task-${i}`, importance: i % 10 + 1 }),
    );
    const { todaysQueue } = rankTasks(tasks, makeContext());
    expect(todaysQueue.length).toBeLessThanOrEqual(7);
  });

  it('excludes done and archived tasks', () => {
    const tasks: Task[] = [
      makeTask({ id: 'done-task', status: 'done' }),
      makeTask({ id: 'archived-task', archived: true }),
      makeTask({ id: 'active', status: 'todo' }),
    ];
    const { ranked } = rankTasks(tasks, makeContext());
    expect(ranked.every((t) => t.status !== 'done' && !t.archived)).toBe(true);
    expect(ranked.length).toBe(1);
  });
});

// ─────────────────────────────────────────
// Determinism
// ─────────────────────────────────────────

describe('Determinism', () => {
  it('produces identical results for the same input', () => {
    const tasks = [
      makeTask({ id: 'a', importance: 7, deadline: '2025-01-20T00:00:00Z' }),
      makeTask({ id: 'b', importance: 5, estimated_minutes: 10 }),
      makeTask({ id: 'c', importance: 9, manual_boost: true }),
    ];
    const ctx = makeContext();
    const r1 = rankTasks(tasks, ctx);
    const r2 = rankTasks(tasks, ctx);
    expect(r1.ranked.map((t) => t.id)).toEqual(r2.ranked.map((t) => t.id));
  });
});
