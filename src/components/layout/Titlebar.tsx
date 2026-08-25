import { Minus, Square, X, Timer } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { AppLogo } from '../ui/AppLogo';
import { useTimerStore } from '../../stores/useTimerStore';

export function Titlebar() {
  const win = getCurrentWindow();
  const { isRunning, timeLeft } = useTimerStore();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="titlebar">
      <div className="titlebar__app-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AppLogo size={16} />
        <span>Compass</span>
        {isRunning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 12, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 600 }}>
            <Timer size={11} />
            <span>{formatTime(timeLeft)}</span>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s infinite' }} />
          </div>
        )}
      </div>
      <div className="titlebar__controls-win">
        <button
          className="titlebar__btn-win titlebar__btn-win--min"
          onClick={() => win.minimize()}
          aria-label="Minimize"
          title="Minimize"
        >
          <Minus size={16} />
        </button>
        <button
          className="titlebar__btn-win titlebar__btn-win--max"
          onClick={() => win.toggleMaximize()}
          aria-label="Maximize"
          title="Maximize"
        >
          <Square size={14} />
        </button>
        <button
          className="titlebar__btn-win titlebar__btn-win--close"
          onClick={() => win.close()}
          aria-label="Close"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
