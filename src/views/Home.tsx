import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Plus, RefreshCw, Command } from 'lucide-react';
import { useTaskStore } from '../stores/useTaskStore';
import { useProjectStore } from '../stores/useProjectStore';
import { FocusCard, FocusCardEmpty } from '../components/tasks/FocusCard';
import { TaskCard } from '../components/tasks/TaskCard';
import { QuickWinCard } from '../components/tasks/QuickWinCard';
import { NewTaskModal } from '../components/tasks/NewTaskModal';

export function Home() {
  const { ranked, isLoading, error, refresh, completeTask, archiveTask, pinTask, startTask } = useTaskStore();
  const { projects, activeProjectId } = useProjectStore();
  const [showNewTask, setShowNewTask] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];

  const context = {
    now: new Date(),
    activeProjectId: activeProjectId,
    completedTaskIds: new Set(
      (ranked?.ranked ?? [])
        .filter((t) => t.status === 'done')
        .map((t) => t.id),
    ),
  };

  useEffect(() => {
    const projectHealthMap = new Map(projects.map((p) => [p.id, p.health_score]));
    refresh(context, projectHealthMap);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setShowNewTask(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    const projectHealthMap = new Map(projects.map((p) => [p.id, p.health_score]));
    refresh(context, projectHealthMap);
  };

  const handleOpenCommands = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  const focus = ranked?.focus ?? null;
  const queue = ranked?.todaysQueue ?? [];
  const queueWithoutFocus = queue.filter((t) => t.id !== focus?.id);
  const quickWins = (ranked?.quickWins ?? []).filter((t) => t.id !== focus?.id);

  return (
    <div className="app-content" style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          <p className="text-muted text-sm">
            {isLoading ? 'Loading…' : `${queue.length} task${queue.length !== 1 ? 's' : ''} in focus`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn--ghost"
            onClick={handleOpenCommands}
            aria-label="Open Command Menu"
            data-tooltip="Open Command Menu (Ctrl + K or /)"
            id="home-commands-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 10px' }}
          >
            <Command size={13} color="var(--accent)" />
            <span>Commands</span>
            <kbd style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontSize: 10, color: 'var(--text-dim)', marginLeft: 2 }}>Ctrl K</kbd>
          </button>
          <button
            className="btn btn--ghost"
            onClick={handleRefresh}
            aria-label="Refresh priorities"
            id="home-refresh"
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            Refresh
          </button>
          <button
            className="btn btn--primary"
            onClick={() => setShowNewTask(true)}
            aria-label="Create new task"
            id="home-new-task"
          >
            <Plus size={14} />
            New Task
          </button>
        </div>
      </div>

      {error && (
        <p className="text-danger text-sm" style={{ marginBottom: 16 }}>{error}</p>
      )}

      {/* Focus Card */}
      <section aria-label="Focus task" style={{ marginBottom: 32 }}>
        {focus ? (
          <FocusCard
            task={focus}
            onStart={startTask}
            onComplete={completeTask}
          />
        ) : (
          <FocusCardEmpty />
        )}
      </section>

      {/* Today's Queue */}
      {queueWithoutFocus.length > 0 && (
        <section aria-label="Today's queue" style={{ marginBottom: 32 }}>
          <p className="section-label">Today's Queue</p>
          <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <AnimatePresence mode="popLayout">
              {queueWithoutFocus.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  onComplete={completeTask}
                  onArchive={archiveTask}
                  onPin={pinTask}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <section aria-label="Quick wins">
          <p className="section-label">Quick Wins</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <AnimatePresence mode="popLayout">
              {quickWins.map((task, i) => (
                <QuickWinCard
                  key={task.id}
                  task={task}
                  index={i}
                  onStart={startTask}
                  onComplete={completeTask}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {!isLoading && queue.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__title">Nothing on your plate.</p>
          <p className="empty-state__desc">Create your first task (press N) or import a project.</p>
          <button
            className="btn btn--primary"
            onClick={() => setShowNewTask(true)}
            id="home-empty-new-task"
          >
            <Plus size={14} />
            Create Task
          </button>
        </div>
      )}

      <NewTaskModal
        isOpen={showNewTask}
        onClose={() => setShowNewTask(false)}
        initialProjectId={activeProject?.id}
      />
    </div>
  );
}
