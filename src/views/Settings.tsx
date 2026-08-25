import { projectRepository } from '../repositories/projectRepository';
import { useProjectStore } from '../stores/useProjectStore';
import { exportService } from '../services/exportService';

export function Settings() {
  return (
    <div className="app-content" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 28 }}>Settings</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Feature Tour */}
        <section className="card" aria-labelledby="settings-tour-label">
          <h3 id="settings-tour-label" style={{ marginBottom: 4 }}>Feature Tour</h3>
          <p className="text-muted text-sm" style={{ marginBottom: 16, lineHeight: 1.6 }}>
            Replay the interactive feature showcase and onboarding tour.
          </p>
          <button
            className="btn btn--primary"
            onClick={async () => {
              await projectRepository.setSetting('has_completed_onboarding', 'false');
              await useProjectStore.getState().loadSettings();
            }}
            id="settings-replay-tour"
          >
            Replay Feature Showcase
          </button>
        </section>

        {/* Data & Backups */}
        <section className="card" aria-labelledby="settings-backup-label">
          <h3 id="settings-backup-label" style={{ marginBottom: 4 }}>Data & Backups</h3>
          <p className="text-muted text-sm" style={{ marginBottom: 16, lineHeight: 1.6 }}>
            Export your workspace data for offline backups or documentation summaries.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn--ghost"
              onClick={() => exportService.exportAllDataAsJson()}
              id="settings-export-json"
            >
              Export Database (.json)
            </button>
            <button
              className="btn btn--ghost"
              onClick={() => exportService.exportProjectAsMarkdown()}
              id="settings-export-md"
            >
              Export Summary (.md)
            </button>
          </div>
        </section>

        {/* About */}
        <section className="card" aria-labelledby="settings-about-label">
          <h3 id="settings-about-label" style={{ marginBottom: 12 }}>About Compass</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Version', '0.1.0'],
              ['Priority Engine', 'v1 — Deterministic'],
              ['Storage', 'Local SQLite + Markdown'],
              ['Network', 'Never'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span className="text-muted">{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Philosophy */}
        <section className="card" style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-muted text-sm" style={{ lineHeight: 1.7, fontStyle: 'italic' }}>
            "What should I work on right now?"
          </p>
          <p className="text-dim text-xs" style={{ marginTop: 6 }}>
            — The only question Compass is designed to answer.
          </p>
        </section>
      </div>
    </div>
  );
}
