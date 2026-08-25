import { useState } from 'react';
import type { ScoreBreakdown } from '../../lib/types';

interface ScoreBreakdownTooltipProps {
  breakdown: ScoreBreakdown;
}

const rows: { key: keyof Omit<ScoreBreakdown, 'total'>; label: string }[] = [
  { key: 'importance',    label: 'Importance' },
  { key: 'deadline',      label: 'Deadline' },
  { key: 'estimatedTime', label: 'Est. Time' },
  { key: 'difficulty',    label: 'Difficulty' },
  { key: 'projectHealth', label: 'Project Health' },
  { key: 'manualBoost',   label: 'Manual Boost' },
  { key: 'longTerm',      label: 'Long-term' },
  { key: 'aging',         label: 'Aging' },
  { key: 'context',       label: 'Context' },
];

export function ScoreBreakdownTooltip({ breakdown }: ScoreBreakdownTooltipProps) {
  const activeRows = rows.filter(({ key }) => breakdown[key] !== 0);

  return (
    <div className="score-breakdown" role="tooltip" aria-label="Score breakdown">
      {activeRows.map(({ key, label }) => {
        const val = breakdown[key];
        return (
          <div key={key} className="score-breakdown__row">
            <span>{label}</span>
            <span className={`score-breakdown__val${val < 0 ? ' score-breakdown__val--negative' : ''}`}>
              {val > 0 ? `+${val}` : val}
            </span>
          </div>
        );
      })}
      <div className="score-breakdown__row score-breakdown__row--total">
        <span>Total</span>
        <span className="score-breakdown__val">{breakdown.total}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────

function getScoreTier(score: number): 'critical' | 'high' | 'normal' | 'low' {
  if (score >= 100) return 'critical';
  if (score >= 60)  return 'high';
  if (score >= 20)  return 'normal';
  return 'low';
}

interface ScoreBadgeProps {
  score: number;
  breakdown?: ScoreBreakdown;
}

export function ScoreBadge({ score, breakdown }: ScoreBadgeProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const tier = getScoreTier(score);

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        className={`score-badge score-badge--${tier}`}
        onMouseEnter={() => breakdown && setShowBreakdown(true)}
        onMouseLeave={() => setShowBreakdown(false)}
        onClick={(e) => { e.stopPropagation(); if (breakdown) setShowBreakdown(!showBreakdown); }}
        aria-label={`Priority score: ${Math.round(score)}`}
        style={{ cursor: breakdown ? 'pointer' : 'default', border: 'none', fontFamily: 'inherit' }}
      >
        {Math.round(score)}
      </button>
      {showBreakdown && breakdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 6,
          zIndex: 100,
        }}>
          <ScoreBreakdownTooltip breakdown={breakdown} />
        </div>
      )}
    </div>
  );
}
