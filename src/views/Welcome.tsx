import { motion } from 'motion/react';
import { Compass, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Welcome() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 32, padding: 40, textAlign: 'center',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
      >
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Compass size={36} color="var(--accent)" strokeWidth={1.5} />
        </div>

        <div>
          <h1 style={{ marginBottom: 8 }}>Welcome to Compass</h1>
          <p className="text-muted" style={{ fontSize: 15, maxWidth: 380, lineHeight: 1.7 }}>
            Compass lives inside a folder on your machine.
            Choose where your projects live to get started.
          </p>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 32px',
          width: 400,
          textAlign: 'left',
        }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Your projects folder</p>
          <p className="text-muted text-sm" style={{ marginBottom: 16, lineHeight: 1.6 }}>
            Choose a folder like <code style={{ color: 'var(--text)', background: 'var(--surface-alt)', padding: '1px 5px', borderRadius: 3 }}>D:\Projects</code> or{' '}
            <code style={{ color: 'var(--text)', background: 'var(--surface-alt)', padding: '1px 5px', borderRadius: 3 }}>Documents\Compass</code>.
            Compass will create one subfolder per project inside it.
          </p>

          <button
            id="welcome-get-started"
            className="btn btn--primary"
            onClick={() => navigate('/projects')}
            style={{ width: '100%', justifyContent: 'center' }}
            aria-label="Get Started"
          >
            <Plus size={14} /> Go to Projects
          </button>
        </div>

        <p className="text-dim text-xs" style={{ maxWidth: 360, lineHeight: 1.6 }}>
          Your data stays on your machine. No account. No cloud. No telemetry.
        </p>
      </motion.div>
    </div>
  );
}
