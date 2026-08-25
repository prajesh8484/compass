import { computeTopicDistribution } from '../../services/analyticsService';
import { useProjectStore } from '../../stores/useProjectStore';
import type { Task } from '../../lib/types';

interface TopicBreakdownProps {
  completedTasks: Task[];
}

export function TopicBreakdown({ completedTasks }: TopicBreakdownProps) {
  const { projects } = useProjectStore();
  const projectNameMap = new Map(projects.map((p) => [p.id, p.name]));
  const topicSlices = computeTopicDistribution(completedTasks, projectNameMap);
  const topSlices = topicSlices.slice(0, 4);

  const total = completedTasks.length;

  if (total === 0) return null;

  const COLORS = ['var(--accent)', 'var(--success)', '#ff9500', '#af52de'];

  return (
    <div className="card" style={{ padding: '16px 20px', flex: 1, minWidth: 260 }}>
      <span className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        Topic Distribution
      </span>
      <p style={{ fontSize: 18, fontWeight: 600, marginTop: 2, marginBottom: 12 }}>
        {topicSlices.length} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>topics completed</span>
      </p>

      {/* Multi-colored segmented bar */}
      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--surface-hover)', marginBottom: 12 }}>
        {topSlices.map((slice, idx) => {
          const percent = (slice.count / total) * 100;
          return (
            <div
              key={slice.key}
              style={{
                width: `${percent}%`,
                background: COLORS[idx % COLORS.length],
                transition: 'width 0.3s ease',
              }}
              data-tooltip={`${slice.key}: ${slice.count} tasks (${Math.round(percent)}%)`}
            />
          );
        })}
      </div>

      {/* Section labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {topSlices.map((slice, idx) => {
          const percent = Math.round((slice.count / total) * 100);
          return (
            <div
              key={slice.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                gap: 12,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                data-tooltip={slice.key}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: COLORS[idx % COLORS.length],
                    flexShrink: 0,
                  }}
                />
                <span className="text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {slice.key}
                </span>
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text)', flexShrink: 0, fontSize: 11, background: 'var(--surface-hover)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                {slice.count} ({percent}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
