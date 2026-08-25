import { motion } from 'motion/react';
import { ArrowRight, Clock, Calendar, Zap } from 'lucide-react';
import { ScoreBreakdownTooltip, ScoreBadge } from './ScoreBreakdown';
import { FocusTimer } from './FocusTimer';
import type { ScoredTask } from '../../lib/types';

interface FocusCardProps {
  task: ScoredTask;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
}

function formatDeadline(deadline: string | null): string | null {
  if (!deadline) return null;
  const due = new Date(deadline);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0)  return 'Overdue';
  if (diffDays < 1)  return 'Due today';
  if (diffDays < 2)  return 'Due tomorrow';
  if (diffDays < 7)  return `${Math.ceil(diffDays)} days left`;
  return due.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

export function FocusCard({ task, onStart, onComplete }: FocusCardProps) {
  const deadlineLabel = formatDeadline(task.deadline);
  const isOverdue = task.deadline && new Date(task.deadline) < new Date();
  const isInProgress = task.status === 'in_progress';

  return (
    <motion.div
      className={`focus-card ${isInProgress ? 'task--active' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      aria-label={`Focus task: ${task.title}`}
      style={{
        border: isInProgress ? '1px solid var(--accent)' : undefined,
        boxShadow: isInProgress ? '0 0 16px rgba(91, 138, 224, 0.15)' : undefined,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <p className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, margin: 0 }}>
              Focus Now
            </p>
            {isInProgress && (
              <span className="chip" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-dim)', fontWeight: 600, fontSize: 11, padding: '2px 8px' }}>
                In Progress
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.3px', lineHeight: 1.3 }}>
            {task.title}
          </h1>
        </div>
        <ScoreBadge score={task.priority_score} breakdown={task.breakdown} />
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-muted" style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.6, maxWidth: 560 }}>
          {task.description}
        </p>
      )}

      {/* Meta chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <span className={`chip chip--${task.difficulty.replace('_', '-')}`}>
          {task.difficulty.replace('_', ' ')}
        </span>

        {task.estimated_minutes !== null && (
          <span className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} />
            {task.estimated_minutes < 60
              ? `${task.estimated_minutes}m`
              : `${Math.floor(task.estimated_minutes / 60)}h`}
          </span>
        )}

        {deadlineLabel && (
          <span
            style={{
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
              color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
            }}
          >
            <Calendar size={12} />
            {deadlineLabel}
          </span>
        )}
      </div>

      {/* Score breakdown inline */}
      <div style={{ marginBottom: 20 }}>
        <ScoreBreakdownTooltip breakdown={task.breakdown} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          id="focus-card-start"
          className="btn btn--primary"
          onClick={() => onStart?.(task.id)}
          aria-label={isInProgress ? 'Currently working on this task' : 'Start working on this task'}
          style={{
            background: isInProgress ? 'var(--accent-dim)' : undefined,
            color: isInProgress ? 'var(--accent)' : undefined,
            borderColor: isInProgress ? 'var(--accent)' : undefined,
          }}
        >
          <Zap size={14} />
          {isInProgress ? 'Working On' : 'Start'}
        </button>
        <button
          id="focus-card-complete"
          className="btn btn--ghost"
          onClick={() => onComplete?.(task.id)}
          aria-label="Mark as complete"
        >
          Done
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Focus Sprint Timer */}
      <FocusTimer taskTitle={task.title} />
    </motion.div>
  );
}

export function FocusCardEmpty() {
  return (
    <div className="focus-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 32px', textAlign: 'center' }}>
      <p className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 600 }}>
        Focus Now
      </p>
      <p style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
        You're all caught up
      </p>
      <p className="text-dim text-sm">
        No active tasks. Create one to get started.
      </p>
    </div>
  );
}
