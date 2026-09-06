import { Minus, Square, X, Timer, Plus } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { AppLogo } from '../ui/AppLogo';
import { useTimerStore } from '../../stores/useTimerStore';

function getPlatform(): 'macos' | 'windows' | 'linux' {
  if (typeof navigator === 'undefined') return 'windows';
  const ua = navigator.userAgent;
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macos';
  if (/Linux/i.test(ua)) return 'linux';
  return 'windows';
}

export function Titlebar() {
  const win = getCurrentWindow();
  const { isRunning, timeLeft } = useTimerStore();
  const platform = getPlatform();
  const isMac = platform === 'macos';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="titlebar" style={{ paddingLeft: isMac ? 0 : 12 }}>
      {/* macOS Traffic Lights (Left-aligned) */}
      {isMac && (
        <div className="titlebar__controls-mac">
          <button
            className="titlebar__btn-mac titlebar__btn-mac--close"
            onClick={() => win.close()}
            aria-label="Close"
            title="Close"
          >
            <X size={8} strokeWidth={3} />
          </button>
          <button
            className="titlebar__btn-mac titlebar__btn-mac--min"
            onClick={() => win.minimize()}
            aria-label="Minimize"
            title="Minimize"
          >
            <Minus size={8} strokeWidth={3} />
          </button>
          <button
            className="titlebar__btn-mac titlebar__btn-mac--max"
            onClick={() => win.toggleMaximize()}
            aria-label="Zoom"
            title="Zoom"
          >
            <Plus size={8} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* App Branding & Sprint Timer Pill */}
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

      {/* Windows & Linux Controls (Right-aligned) */}
      {!isMac && (
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
      )}
    </div>
  );
}
