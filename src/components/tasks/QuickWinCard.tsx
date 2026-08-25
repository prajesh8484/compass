import { motion } from 'motion/react';
import { Clock, Zap } from 'lucide-react';
import type { ScoredTask } from '../../lib/types';

interface QuickWinCardProps {
  task: ScoredTask;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  index?: number;
}

export function QuickWinCard({ task, onStart, onComplete, index = 0 }: QuickWinCardProps) {
  return (
    <motion.div
      layout
      className={`card card--interactive ${task.status === 'in_progress' ? 'task--active' : ''}`}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0, padding: 0, overflow: 'hidden' }}
      transition={{ delay: index * 0.06, duration: 0.15 }}
      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
      aria-label={`Quick win: ${task.title}`}
    >
      <Zap size={14} color="var(--success)" style={{ flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.title}
        </p>
        {task.estimated_minutes !== null && (
          <p className="text-muted text-xs" style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <Clock size={10} />
            {task.estimated_minutes}m
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          className="btn btn--ghost"
          style={{
            padding: '4px 10px',
            fontSize: 12,
            background: task.status === 'in_progress' ? 'var(--accent-dim)' : undefined,
            color: task.status === 'in_progress' ? 'var(--accent)' : undefined,
            borderColor: task.status === 'in_progress' ? 'var(--accent)' : undefined,
          }}
          onClick={(e) => { e.stopPropagation(); onStart?.(task.id); }}
          aria-label={`Start quick win: ${task.title}`}
        >
          {task.status === 'in_progress' ? 'Working On' : 'Start'}
        </button>
        <button
          className="btn btn--ghost"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onClick={(e) => { e.stopPropagation(); onComplete?.(task.id); }}
          aria-label={`Complete quick win: ${task.title}`}
        >
          Done
        </button>
      </div>
    </motion.div>
  );
}
