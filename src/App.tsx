import { useEffect, useState, useCallback } from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { Titlebar } from './components/layout/Titlebar';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/layout/CommandPalette';
import { AppRoutes } from './router/AppRoutes';
import { useProjectStore } from './stores/useProjectStore';
import './styles/index.css';

import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { NewTaskModal } from './components/tasks/NewTaskModal';
import { useTimerStore } from './stores/useTimerStore';
import { useTaskStore } from './stores/useTaskStore';

function AppInner() {
  const navigate = useNavigate();
  const { settings, loadSettings, loadProjects, activeProjectId, projects } = useProjectStore();
  const { isRunning, tick } = useTimerStore();
  const { forceRefresh } = useTaskStore();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      tick();
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning, tick]);

  useEffect(() => {
    const bootstrap = async () => {
      await loadSettings();
      await loadProjects();
      setBootstrapped(true);
    };
    bootstrap();
  }, [loadSettings, loadProjects]);

  useEffect(() => {
    if (bootstrapped && settings?.has_completed_onboarding !== 'true') {
      setShowTour(true);
    }
  }, [bootstrapped, settings]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input or textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setPaletteOpen((open) => !open);
    } else if (e.key === '/') {
      e.preventDefault();
      setPaletteOpen(true);
    } else if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      setShowNewTask(true);
    } else if ((e.ctrlKey || e.metaKey) && e.key === '1') {
      e.preventDefault();
      navigate('/');
    } else if ((e.ctrlKey || e.metaKey) && e.key === '2') {
      e.preventDefault();
      navigate('/projects');
    } else if ((e.ctrlKey || e.metaKey) && e.key === '3') {
      e.preventDefault();
      navigate('/tasks');
    } else if ((e.ctrlKey || e.metaKey) && e.key === '4') {
      e.preventDefault();
      navigate('/completed');
    } else if ((e.ctrlKey || e.metaKey) && (e.key === '5' || e.key === ',')) {
      e.preventDefault();
      navigate('/settings');
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!bootstrapped) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Titlebar />

      <div className="app-body">
        <Sidebar />
        <main style={{ flex: 1, height: '100%', minHeight: 0, overflow: 'hidden' }}>
          <AppRoutes />
        </main>
      </div>

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNewTask={() => setShowNewTask(true)}
      />

      <NewTaskModal
        isOpen={showNewTask}
        onClose={() => {
          setShowNewTask(false);
          forceRefresh();
        }}
        initialProjectId={activeProject?.id}
      />

      <OnboardingModal
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <MemoryRouter>
      <AppInner />
    </MemoryRouter>
  );
}
