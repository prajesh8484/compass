import { useState } from 'react';
import { Play, Pause, RotateCcw, Timer, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTimerStore } from '../../stores/useTimerStore';

interface FocusTimerProps {
  taskTitle?: string;
  onSessionComplete?: () => void;
}

const PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '25m', minutes: 25 },
  { label: '45m', minutes: 45 },
];

export function FocusTimer(_props: FocusTimerProps) {
  const { selectedMinutes, timeLeft, isRunning, isCompleted, setPreset, togglePlay, resetTimer } = useTimerStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSeconds = selectedMinutes * 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          className="btn btn--ghost"
          style={{ padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Timer size={13} color="var(--accent)" />
          <span>Sprint Timer: <strong style={{ color: 'var(--text)' }}>{formatTime(timeLeft)}</strong></span>
          {isRunning && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s infinite' }} />
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className={`btn ${isRunning ? 'btn--ghost' : 'btn--primary'}`}
            style={{ padding: '4px 10px', fontSize: 12, height: 28 }}
            onClick={togglePlay}
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
          >
            {isCompleted ? (
              <>
                <Check size={12} /> Finished
              </>
            ) : isRunning ? (
              <>
                <Pause size={12} /> Pause
              </>
            ) : (
              <>
                <Play size={12} /> Start Sprint
              </>
            )}
          </button>
          <button
            className="btn btn--icon"
            style={{ padding: 4, height: 28, width: 28 }}
            onClick={resetTimer}
            aria-label="Reset timer"
            data-tooltip="Reset timer"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {/* Presets */}
              <div style={{ display: 'flex', gap: 6 }}>
                {PRESETS.map((p) => (
                  <button
                    key={p.minutes}
                    className={`btn ${selectedMinutes === p.minutes ? 'btn--primary' : 'btn--ghost'}`}
                    style={{
                      padding: '2px 8px',
                      fontSize: 11,
                      height: 24,
                      background: selectedMinutes === p.minutes ? 'var(--accent)' : 'transparent',
                    }}
                    onClick={() => setPreset(p.minutes)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Circular progress visual */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="28" height="28" viewBox="0 0 56 56">
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    fill="transparent"
                    stroke="var(--surface-hover)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    fill="transparent"
                    stroke={isCompleted ? 'var(--success)' : 'var(--accent)'}
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 28 28)"
                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                  />
                </svg>
                <span className="text-muted text-xs">
                  {Math.round(progressPercent)}% elapsed
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
