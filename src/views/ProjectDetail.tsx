import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, Folder } from 'lucide-react';
import { useProjectStore } from '../stores/useProjectStore';
import { useTaskStore } from '../stores/useTaskStore';
import { TaskCard } from '../components/tasks/TaskCard';
import { NewTaskModal } from '../components/tasks/NewTaskModal';
import type { ScoredTask } from '../lib/types';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, loadProjects } = useProjectStore();
  const { tasks, completeTask, archiveTask, pinTask } = useTaskStore();
  
  const [activeSection, setActiveSection] = useState<string>('All');
  const [showNewTask, setShowNewTask] = useState(false);

  useEffect(() => {
    if (projects.length === 0) loadProjects();
  }, []);

  const project = projects.find((p) => p.id === id);
  const projectTasks = tasks.filter((t) => t.project_id === id);

  const sections = Array.from(
    new Set(['All', 'General', ...projectTasks.map((t) => t.section || 'General')])
  );

  const filteredTasks = activeSection === 'All'
    ? projectTasks
    : projectTasks.filter((t) => (t.section || 'General') === activeSection);

  const groupedTasks: Record<string, ScoredTask[]> = {};
  if (activeSection === 'All') {
    for (const task of projectTasks) {
      const sec = task.section || 'General';
      if (!groupedTasks[sec]) groupedTasks[sec] = [];
      groupedTasks[sec].push(task);
    }
  }

  if (!project) {
    return (
      <div className="app-content" style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
        <p className="text-muted">Project not found.</p>
        <button className="btn btn--ghost" onClick={() => navigate('/projects')} style={{ marginTop: 16 }}>
          <ArrowLeft size={14} /> Back to Projects
        </button>
      </div>
    );
  }

  const completedCount = projectTasks.filter((t) => t.status === 'done').length;

  return (
    <div className="app-content" style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn--ghost" onClick={() => navigate('/projects')} aria-label="Back to projects">
          <ArrowLeft size={16} />
        </button>
        <span className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Projects / {project.name}
        </span>
      </div>

      {/* Project Banner */}
      <div className="card" style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: project.color }} />
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600 }}>{project.name}</h1>
              {project.folder_path && (
                <p className="text-muted text-xs" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Folder size={12} /> {project.folder_path}
                </p>
              )}
            </div>
          </div>

          <button
            className="btn btn--primary"
            onClick={() => setShowNewTask(true)}
            id="project-detail-new-task"
          >
            <Plus size={14} />
            New Task
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 24, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div>
            <p className="text-muted text-xs">Total Tasks</p>
            <p style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{projectTasks.length}</p>
          </div>
          <div>
            <p className="text-muted text-xs">Completed</p>
            <p style={{ fontSize: 16, fontWeight: 600, marginTop: 2, color: 'var(--success)' }}>{completedCount}</p>
          </div>
          <div>
            <p className="text-muted text-xs">Health Score</p>
            <p style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>
              {project.health_score === 0 ? 'Healthy' : `-${project.health_score}`}
            </p>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {sections.map((sec) => (
          <button
            key={sec}
            className={`btn ${activeSection === sec ? 'btn--primary' : 'btn--ghost'}`}
            style={{ padding: '4px 12px', fontSize: 13, borderRadius: 'var(--radius)' }}
            onClick={() => setActiveSection(sec)}
          >
            {sec}
            {sec !== 'All' && (
              <span className="text-xs" style={{ marginLeft: 6, opacity: 0.7 }}>
                ({projectTasks.filter((t) => (t.section || 'General') === sec).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task List */}
      {projectTasks.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">No tasks in this project</p>
          <p className="empty-state__desc">Create your first task to start organizing your work.</p>
          <button className="btn btn--primary" onClick={() => setShowNewTask(true)} style={{ marginTop: 12 }}>
            <Plus size={14} /> Add Task
          </button>
        </div>
      ) : activeSection !== 'All' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task, i) => (
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(groupedTasks).map(([secName, secTasks]) => (
            <section key={secName}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 className="section-label" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {secName} ({secTasks.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AnimatePresence mode="popLayout">
                  {secTasks.map((task, i) => (
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
          ))}
        </div>
      )}

      {/* New Task Modal pre-selected with this project */}
      <NewTaskModal
        isOpen={showNewTask}
        onClose={() => setShowNewTask(false)}
        initialProjectId={project.id}
        initialSection={activeSection !== 'All' ? activeSection : 'General'}
      />
    </div>
  );
}
