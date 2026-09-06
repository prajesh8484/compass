import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, AlertCircle } from 'lucide-react';
import type { CreateTaskPayload, Difficulty } from '../../lib/types';
import { CustomSelect } from '../ui/CustomSelect';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import { useProjectStore } from '../../stores/useProjectStore';
import { useTaskStore } from '../../stores/useTaskStore';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payload: CreateTaskPayload) => Promise<void>;
  initialProjectId?: string;
  initialSection?: string;
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy',      label: 'Easy' },
  { value: 'medium',    label: 'Medium' },
  { value: 'hard',      label: 'Hard' },
  { value: 'very_hard', label: 'Very Hard' },
];

const EFFORT_OPTIONS = [
  { value: '0.5',         label: '0.5 hour (30m)' },
  { value: '1',           label: '1 hour' },
  { value: '2',           label: '2 hours' },
  { value: '4',           label: '4 hours' },
  { value: '8',           label: '8 hours' },
  { value: '16',          label: '16+ hours' },
  { value: 'unspecified', label: 'Complex / Unspecified' },
];

export function NewTaskModal({
  isOpen,
  onClose,
  onSubmit,
  initialProjectId,
  initialSection = 'General',
}: NewTaskModalProps) {
  const { projects } = useProjectStore();
  const { createTask } = useTaskStore();

  const [projectId, setProjectId] = useState(initialProjectId || (projects[0]?.id ?? ''));
  const [section, setSection] = useState(initialSection);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [estimatedHours, setEstimatedHours] = useState('1');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; project?: string; importance?: string }>({});
  const [shakingField, setShakingField] = useState<string | null>(null);

  const triggerShake = (field: string) => {
    setShakingField(field);
    setTimeout(() => setShakingField(null), 300);
  };

  useEffect(() => {
    if (initialProjectId) setProjectId(initialProjectId);
    else if (projects.length > 0 && !projectId) setProjectId(projects[0].id);
    if (initialSection) setSection(initialSection);
  }, [initialProjectId, initialSection, projects]);

  const reset = () => {
    setTitle(''); setDescription(''); setImportance(5);
    setDifficulty('medium'); setEstimatedHours('1'); setDeadline('');
    setSection('General');
    setError(null);
    setFieldErrors({});
    setShakingField(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; project?: string; importance?: string } = {};
    const targetProjectId = projectId || projects[0]?.id;

    if (!targetProjectId) {
      newErrors.project = 'Please create a project first';
    }
    if (!title.trim()) {
      newErrors.title = 'Task title is required';
    }
    if (isNaN(importance) || importance < 1 || importance > 10) {
      newErrors.importance = 'Importance must be between 1 and 10';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      if (newErrors.title) triggerShake('title');
      else if (newErrors.project) triggerShake('project');
      else if (newErrors.importance) triggerShake('importance');
      return;
    }

    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      const minutes = estimatedHours === 'unspecified'
        ? undefined
        : Math.round(parseFloat(estimatedHours) * 60);

      const payload: CreateTaskPayload = {
        project_id: targetProjectId,
        section: section.trim() || 'General',
        title: title.trim(),
        description: description.trim() || undefined,
        importance,
        difficulty,
        estimated_minutes: minutes,
        deadline: deadline || undefined,
      };

      if (onSubmit) {
        await onSubmit(payload);
      } else {
        await createTask(payload);
      }
      reset();
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (title.trim() && !submitting) {
        const formEvent = new Event('submit', { cancelable: true, bubbles: true }) as unknown as React.FormEvent;
        handleSubmit(formEvent);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          onClick={handleClose}
        >
          <motion.div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              width: 520,
              maxWidth: '90vw',
              overflow: 'visible',
              position: 'relative',
              zIndex: 1000,
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3>New Task</h3>
              <button className="btn btn--icon" onClick={handleClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate autoComplete="off" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <input
                  className={`input ${fieldErrors.title ? 'input--error' : ''} ${shakingField === 'title' ? 'input-shake' : ''}`}
                  placeholder="Task title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (fieldErrors.title) {
                      setFieldErrors((prev) => ({ ...prev, title: undefined }));
                    }
                  }}
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  id="new-task-title"
                  aria-label="Task title"
                  aria-invalid={Boolean(fieldErrors.title)}
                />
                {fieldErrors.title && (
                  <div className="form-error">
                    <AlertCircle size={12} />
                    <span>{fieldErrors.title}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="text-muted text-xs" style={{ display: 'block', marginBottom: 6 }} htmlFor="new-task-project">
                    Project
                  </label>
                  <CustomSelect
                    id="new-task-project"
                    options={projects.map((p) => ({ value: p.id, label: p.name }))}
                    value={projectId}
                    onChange={(val) => {
                      setProjectId(val);
                      if (fieldErrors.project) {
                        setFieldErrors((prev) => ({ ...prev, project: undefined }));
                      }
                    }}
                  />
                  {fieldErrors.project && (
                    <div className="form-error">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.project}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-muted text-xs" style={{ display: 'block', marginBottom: 6 }} htmlFor="new-task-section">
                    Section / Topic
                  </label>
                  <input
                    id="new-task-section"
                    className="input input--sm"
                    placeholder="e.g. Frontend, Docs"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                  />
                </div>
              </div>

              <div>
                <textarea
                  className="input"
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  id="new-task-description"
                  aria-label="Task description"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="text-muted text-xs" style={{ display: 'block', marginBottom: 6 }} htmlFor="new-task-importance">
                    Importance (1–10)
                  </label>
                  <input
                    id="new-task-importance"
                    className={`input input--sm ${fieldErrors.importance ? 'input--error' : ''} ${shakingField === 'importance' ? 'input-shake' : ''}`}
                    type="number"
                    min={1} max={10}
                    value={importance}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setImportance(isNaN(val) ? 5 : val);
                      if (fieldErrors.importance) {
                        setFieldErrors((prev) => ({ ...prev, importance: undefined }));
                      }
                    }}
                    aria-invalid={Boolean(fieldErrors.importance)}
                  />
                  {fieldErrors.importance && (
                    <div className="form-error">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.importance}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-muted text-xs" style={{ display: 'block', marginBottom: 6 }} htmlFor="new-task-difficulty">
                    Difficulty
                  </label>
                  <CustomSelect
                    id="new-task-difficulty"
                    options={DIFFICULTIES}
                    value={difficulty}
                    onChange={(val) => setDifficulty(val as Difficulty)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="text-muted text-xs" style={{ display: 'block', marginBottom: 6 }} htmlFor="new-task-time">
                    Est. Effort (Hours)
                  </label>
                  <CustomSelect
                    id="new-task-time"
                    options={EFFORT_OPTIONS}
                    value={estimatedHours}
                    onChange={(val) => setEstimatedHours(val)}
                    position="top"
                  />
                </div>
                <div>
                  <label className="text-muted text-xs" style={{ display: 'block', marginBottom: 6 }} htmlFor="new-task-deadline">
                    Deadline
                  </label>
                  <CustomDatePicker
                    id="new-task-deadline"
                    value={deadline}
                    onChange={(val) => setDeadline(val)}
                    position="top"
                  />
                </div>
              </div>

              {error && (
                <div className="form-error" style={{ marginTop: 2 }}>
                  <AlertCircle size={13} />
                  <span>{error}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                <button type="button" className="btn btn--ghost" onClick={handleClose}>
                  Cancel
                </button>
                <button
                  id="new-task-submit"
                  type="submit"
                  className="btn btn--primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating…' : 'Create Task'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
