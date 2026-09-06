import { useState } from 'react';
import { motion } from 'motion/react';
import { Pin, Clock, CheckCircle2, Archive, AlertCircle, RotateCcw } from 'lucide-react';
import { ScoreBadge } from './ScoreBreakdown';
import type { ScoredTask } from '../../lib/types';

interface TaskCardProps {
  task: ScoredTask;
  onComplete?: (id: string) => void;
  onReopen?: (id: string) => void;
  onArchive?: (id: string) => void;
  onPin?: (id: string, pinned: boolean) => void;
  onClick?: (task: ScoredTask) => void;
  index?: number;
}

function formatEstimatedTime(minutes: number | null): string {
  if (minutes === null || minutes === 0) return 'Complex / Unspecified';
  if (minutes < 60) return `${(minutes / 60).toFixed(1).replace('.0', '')}h`;
  const h = (minutes / 60).toFixed(1).replace('.0', '');
  return `${h}h`;
}

function formatDeadline(deadline: string | null): { label: string; urgent: boolean } | null {
  if (!deadline) return null;
  const due = new Date(deadline);
  const now = new Date();
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return { label: 'Overdue', urgent: true };
  if (diffDays < 1) return { label: 'Due today', urgent: true };
  if (diffDays < 2) return { label: 'Due tomorrow', urgent: true };
  if (diffDays < 7) return { label: `${Math.ceil(diffDays)}d left`, urgent: false };
  return { label: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), urgent: false };
}

function formatCompletedMeta(completedAt: string | null, updatedAt: string, deadline: string | null): { completedText: string; wasDueText?: string } {
  const dateStr = completedAt || updatedAt;
  const completed = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - completed.getTime()) / (1000 * 60 * 60 * 24));

  let completedText = `Completed ${completed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  if (diffDays <= 0) completedText = 'Completed Today';
  else if (diffDays === 1) completedText = 'Completed Yesterday';

  let wasDueText: string | undefined;
  if (deadline) {
    const due = new Date(deadline);
    wasDueText = `Was due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  return { completedText, wasDueText };
}

export function TaskCard({
  task,
  onComplete,
  onReopen,
  onArchive,
  onPin,
  onClick,
  index = 0,
}: TaskCardProps) {
  const [blockedWarning, setBlockedWarning] = useState(false);
  const deadline = formatDeadline(task.deadline);
  const timeEst = formatEstimatedTime(task.estimated_minutes);
  const isDone = task.status === 'done';
  const isArchived = Boolean(task.archived);
  const isInactive = isDone || isArchived;
  const completedMeta = isDone ? formatCompletedMeta(task.completed_at, task.updated_at, task.deadline) : null;

  const handleCompleteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.isBlocked && !isDone) {
      setBlockedWarning(true);
      setTimeout(() => setBlockedWarning(false), 2200);
      return;
    }
    if (isDone) {
      onReopen?.(task.id);
    } else {
      onComplete?.(task.id);
    }
  };

  return (
    <motion.div
      layout
      className={`card card--interactive ${task.status === 'in_progress' ? 'task--active' : ''}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isDone ? 0.7 : isArchived ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0, padding: 0, overflow: 'hidden' }}
      transition={{ delay: index * 0.04, duration: 0.15, ease: 'easeOut' }}
      onClick={() => onClick?.(task)}
      role="listitem"
      aria-label={`Task: ${task.title}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        opacity: isDone ? 0.7 : isArchived ? 0.6 : 1,
        background: isDone ? 'rgba(255, 255, 255, 0.02)' : undefined,
      }}
    >
      {/* Complete / Reopen button */}
      <button
        className={`btn btn--icon ${blockedWarning ? 'input-shake' : ''}`}
        onClick={handleCompleteToggle}
        aria-label={isDone ? 'Reopen task' : task.isBlocked ? 'Blocked by dependency' : 'Mark as complete'}
        data-tooltip={isDone ? 'Completed (Click to Reopen)' : task.isBlocked ? 'Blocked by dependency' : 'Complete'}
        style={{
          flexShrink: 0,
          marginTop: 1,
          color: isDone ? 'var(--success)' : task.isBlocked ? 'var(--danger)' : 'var(--text-dim)',
          cursor: task.isBlocked && !isDone ? 'not-allowed' : 'pointer',
        }}
      >
        {task.isBlocked && !isDone ? (
          <AlertCircle size={16} color="var(--danger)" />
        ) : (
          <CheckCircle2 size={16} strokeWidth={isDone ? 2 : 1.6} />
        )}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontSize: 14,
            fontWeight: 500,
            color: task.isBlocked || isInactive ? 'var(--text-muted)' : 'var(--text)',
            textDecoration: isDone ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {task.title}
          </span>
          {task.isBlocked && !isDone && (
            <span
              className={`chip ${blockedWarning ? 'input-shake' : ''}`}
              style={{
                background: blockedWarning ? 'rgba(235, 87, 87, 0.28)' : 'rgba(235, 87, 87, 0.15)',
                color: 'var(--danger)',
                border: '1px solid rgba(235, 87, 87, 0.3)',
                fontSize: 11,
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              data-tooltip="Prerequisites must be completed first"
            >
              {blockedWarning ? 'Complete Prerequisites First!' : 'Blocked'}
            </span>
          )}
          {isArchived ? (
            <span className="chip text-muted" style={{ fontWeight: 500 }}>
              Archived
            </span>
          ) : isDone ? (
            <span className="chip" style={{ background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid var(--success-dim)', fontWeight: 600 }}>
              Done
            </span>
          ) : task.status === 'in_progress' ? (
            <span className="chip" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-dim)', fontWeight: 600 }}>
              In Progress
            </span>
          ) : (
            <ScoreBadge score={task.priority_score} breakdown={task.breakdown} />
          )}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Difficulty chip */}
          <span className={`chip chip--${task.difficulty.replace('_', '-')}`}>
            {task.difficulty.replace('_', ' ')}
          </span>

          {/* Estimated time */}
          {timeEst && (
            <span className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={11} />
              {timeEst}
            </span>
          )}

          {/* Deadline / Completed Date */}
          {isDone && completedMeta ? (
            <span className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{completedMeta.completedText}</span>
              {completedMeta.wasDueText && <span className="text-dim">• {completedMeta.wasDueText}</span>}
            </span>
          ) : deadline ? (
            <span
              className="text-sm"
              style={{ color: deadline.urgent ? 'var(--danger)' : 'var(--text-muted)' }}
            >
              {deadline.label}
            </span>
          ) : null}

          {/* Pinned indicator */}
          {!isInactive && task.pinned && (
            <Pin size={11} color="var(--accent)" />
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{ display: 'flex', gap: 4, flexShrink: 0, opacity: isInactive ? 1 : undefined }}
        className="task-card-actions"
        onClick={(e) => e.stopPropagation()}
      >
        {isDone ? (
          <>
            <button
              className="btn btn--ghost"
              onClick={() => onReopen?.(task.id)}
              aria-label="Reopen task"
              data-tooltip="Reopen task"
              style={{ padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <RotateCcw size={12} /> Undo
            </button>
            <button
              className="btn btn--icon"
              onClick={() => onArchive?.(task.id)}
              aria-label="Archive"
              data-tooltip="Archive"
              style={{ color: 'var(--text-muted)' }}
            >
              <Archive size={14} />
            </button>
          </>
        ) : !isArchived ? (
          <button
            className="btn btn--icon"
            onClick={() => onPin?.(task.id, !task.pinned)}
            aria-label={task.pinned ? 'Unpin' : 'Pin'}
            data-tooltip={task.pinned ? 'Unpin' : 'Pin'}
            style={{ color: task.pinned ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <Pin size={14} />
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}
