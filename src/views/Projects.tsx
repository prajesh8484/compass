import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, FolderOpen, AlertCircle } from 'lucide-react';
import { useProjectStore } from '../stores/useProjectStore';
import { useTaskStore } from '../stores/useTaskStore';
import { open } from '@tauri-apps/plugin-dialog';
import type { ScoringContext } from '../lib/types';

export function Projects() {
  const navigate = useNavigate();
  const { projects, loadProjects, createProject, setActiveProject, activeProjectId } = useProjectStore();
  const { refresh } = useTaskStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPath, setNewPath] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [isNameShaking, setIsNameShaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadProjects(); }, []);

  const handlePickFolder = async () => {
    const selected = await open({ directory: true, multiple: false, title: 'Choose project folder' });
    if (selected && typeof selected === 'string') {
      setNewPath(selected);
      if (!newName) {
        setNewName(selected.split(/[\\/]/).pop() ?? '');
      }
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      setNameError('Project name is required');
      setIsNameShaking(true);
      setTimeout(() => setIsNameShaking(false), 300);
      return;
    }
    setError(null);
    setNameError(null);
    try {
      await createProject({ name: newName.trim(), folder_path: newPath.trim() });
      setNewName(''); setNewPath(''); setCreating(false);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleSelectProject = (id: string) => {
    setActiveProject(id);
    const ctx: ScoringContext = {
      now: new Date(),
      activeProjectId: id,
      completedTaskIds: new Set(),
    };
    refresh(ctx);
    navigate(`/projects/${id}`);
  };

  return (
    <div className="app-content" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h2>Projects</h2>
        <button
          className="btn btn--primary"
          onClick={() => setCreating(true)}
          id="projects-new"
          aria-label="New project"
        >
          <Plus size={14} />
          New Project
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <motion.div
          className="card"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <h3 style={{ marginBottom: 4 }}>New Project</h3>
          <div>
            <input
              className={`input ${nameError ? 'input--error' : ''} ${isNameShaking ? 'input-shake' : ''}`}
              placeholder="Project name (e.g. My Website)"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (nameError) setNameError(null);
              }}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              id="project-name-input"
              aria-invalid={Boolean(nameError)}
            />
            {nameError && (
              <div className="form-error">
                <AlertCircle size={12} />
                <span>{nameError}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder="Folder path"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              id="project-path-input"
            />
            <button className="btn btn--ghost" onClick={handlePickFolder} aria-label="Browse folder">
              <FolderOpen size={14} />
            </button>
          </div>
          {error && (
            <div className="form-error">
              <AlertCircle size={12} />
              <span>{error}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn--ghost" onClick={() => { setCreating(false); setError(null); setNameError(null); }}>
              Cancel
            </button>
            <button className="btn btn--primary" onClick={handleCreate} id="project-create-submit">
              Create
            </button>
          </div>
        </motion.div>
      )}

      {/* Project list */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <FolderOpen size={28} className="empty-state__icon" />
          <p className="empty-state__title">No projects yet</p>
          <p className="empty-state__desc">Create your first project to get started</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="list">
          {projects.map((project, i) => (
            <motion.button
              key={project.id}
              className={`card card--interactive${project.id === activeProjectId ? ' active' : ''}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleSelectProject(project.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                width: '100%', border: project.id === activeProjectId
                  ? '1px solid var(--accent)'
                  : '1px solid var(--border)',
              }}
              role="listitem"
              aria-label={`Project: ${project.name}`}
              id={`project-item-${project.id}`}
            >
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: project.color,
              }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500, fontSize: 14 }}>{project.name}</p>
                <p className="text-muted text-xs" style={{ marginTop: 2 }}>{project.folder_path}</p>
              </div>
              {project.health_score > 0 && (
                <span className="chip" style={{
                  background: project.health_score > 12 ? 'rgba(235, 87, 87, 0.15)' : 'rgba(255, 149, 0, 0.15)',
                  color: project.health_score > 12 ? 'var(--danger)' : '#ff9500',
                  border: `1px solid ${project.health_score > 12 ? 'rgba(235, 87, 87, 0.3)' : 'rgba(255, 149, 0, 0.3)'}`,
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {project.health_score > 20 ? 'Critical (30d+)' : project.health_score > 12 ? 'Neglected (14d+)' : 'Needs Attention'}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
