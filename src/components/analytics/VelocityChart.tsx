import { computeVelocity, computeStreak } from '../../services/analyticsService';
import type { Task } from '../../lib/types';

interface VelocityChartProps {
  completedTasks: Task[];
}

export function VelocityChart({ completedTasks }: VelocityChartProps) {
  const velocityData = computeVelocity(completedTasks, 7);
  const currentStreak = computeStreak(completedTasks);
  const totalThisWeek = velocityData.reduce((acc, d) => acc + d.count, 0);

  const maxCount = Math.max(1, ...velocityData.map((d) => d.count));
  const chartHeight = 60;
  const barWidth = 28;
  const gap = 12;
  const totalWidth = velocityData.length * (barWidth + gap);

  return (
    <div className="card" style={{ padding: '16px 20px', flex: 1, minWidth: 260 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <span className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            7-Day Velocity
          </span>
          <p style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>
            {totalThisWeek} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>completed</span>
          </p>
        </div>
        {currentStreak > 0 && (
          <span className="chip" style={{ background: 'rgba(255, 149, 0, 0.15)', color: '#ff9500', border: '1px solid rgba(255, 149, 0, 0.3)', gap: 4, fontWeight: 600, fontSize: 11 }}>
            🔥 {currentStreak}d Streak
          </span>
        )}
      </div>

      {/* SVG Bar Chart */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width={totalWidth} height={chartHeight + 20} viewBox={`0 0 ${totalWidth} ${chartHeight + 20}`}>
          {velocityData.map((day, idx) => {
            const x = idx * (barWidth + gap);
            const barH = Math.max(4, (day.count / maxCount) * chartHeight);
            const y = chartHeight - barH;
            const isToday = idx === velocityData.length - 1;
            const dayLabel = isToday ? 'Today' : idx === velocityData.length - 2 ? 'Yest' : day.label;

            return (
              <g key={day.date}>
                {/* Background column */}
                <rect
                  x={x}
                  y={0}
                  width={barWidth}
                  height={chartHeight}
                  rx={4}
                  fill="var(--surface-hover)"
                  opacity={0.4}
                />
                {/* Active bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={4}
                  fill={isToday ? 'var(--accent)' : day.count > 0 ? 'var(--success)' : 'transparent'}
                />
                {/* Count label on hover/top */}
                {day.count > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={Math.max(10, y - 4)}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="9"
                    fontWeight="600"
                  >
                    {day.count}
                  </text>
                )}
                {/* Day label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 14}
                  textAnchor="middle"
                  fill={isToday ? 'var(--text)' : 'var(--text-dim)'}
                  fontSize="10"
                  fontWeight={isToday ? '600' : '400'}
                >
                  {dayLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
