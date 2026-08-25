import { useEffect, useState } from 'react';
import { Plus, Search, ArchiveRestore, CheckSquare, Square, Check, Archive, Trash2, FolderEdit, X } from 'lucide-react';
import { useTaskStore } from '../stores/useTaskStore';
import { useProjectStore } from '../stores/useProjectStore';
import { taskRepository } from '../repositories/taskRepository';
import { TaskCard } from '../components/tasks/TaskCard';
import { NewTaskModal } from '../components/tasks/NewTaskModal';
import { motion, AnimatePresence } from 'motion/react';
import type { ScoredTask, TaskStatus, Task } from '../lib/types';

type FilterStatus = TaskStatus | 'all' | 'archived';

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all',         label: 'All' },
  { value: 'todo',        label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done',        label: 'Done' },
  { value: 'archived',    label: 'Archived' },
];

export function AllTasks() {
  const {
    tasks: activeScoredTasks,
    refresh,
    completeTask,
    reopenTask,
    archiveTask,
    pinTask,
    bulkComplete,
    bulkArchive,
    bulkReassignSection,
    bulkDelete,
  } = useTaskStore();

  const { projects, activeProjectId } = useProjectStore();
  const [allTasksList, setAllTasksList] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [showNewTask, setShowNewTask] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSectionPrompt, setShowSectionPrompt] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];

  const loadAll = async () => {
    setLoading(true);
    try {
      const all = await taskRepository.getAll();
      setAllTasksList(all);
    } catch (err) {
      console.error('Failed to load all tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    refresh({
      now: new Date(),
      activeProjectId,
      completedTaskIds: new Set(activeScoredTasks.filter((t) => t.status === 'done').map((t) => t.id)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplete = async (id: string) => {
    await completeTask(id);
    await loadAll();
  };

  const handleReopen = async (id: string) => {
    await reopenTask(id);
    await loadAll();
  };

  const handleArchive = async (id: string) => {
    await archiveTask(id);
    await loadAll();
  };

  const handleUnarchive = async (id: string) => {
    await taskRepository.unarchive(id);
    await loadAll();
    refresh({
      now: new Date(),
      activeProjectId,
      completedTaskIds: new Set(activeScoredTasks.filter((t) => t.status === 'done').map((t) => t.id)),
    });
  };

  const toggleSelectTask = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.id)));
    }
  };

  const handleBulkComplete = async () => {
    const ids = Array.from(selectedIds);
    await bulkComplete(ids);
    setSelectedIds(new Set());
    setSelectionMode(false);
    await loadAll();
  };

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedIds);
    await bulkArchive(ids);
    setSelectedIds(new Set());
    setSelectionMode(false);
    await loadAll();
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedIds.size} selected tasks?`)) {
      const ids = Array.from(selectedIds);
      await bulkDelete(ids);
      setSelectedIds(new Set());
      setSelectionMode(false);
      await loadAll();
    }
  };

  const handleBulkReassign = async () => {
    if (!newSectionName.trim()) return;
    const ids = Array.from(selectedIds);
    await bulkReassignSection(ids, newSectionName.trim());
    setSelectedIds(new Set());
    setShowSectionPrompt(false);
    setNewSectionName('');
    setSelectionMode(false);
    await loadAll();
  };

  const scoredMap = new Map(activeScoredTasks.map((t) => [t.id, t]));

  const displayTasks: ScoredTask[] = allTasksList.map((t) => {
    const scored = scoredMap.get(t.id);
    if (scored) return scored;
    return {
      ...t,
      priority_score: 0,
      isBlocked: false,
      breakdown: {
        importance: 0, deadline: 0, estimatedTime: 0, difficulty: 0,
        projectHealth: 0, manualBoost: 0, longTerm: 0, aging: 0, context: 0,
        total: 0,
      },
    };
  });

  const filtered = displayTasks.filter((task) => {
    if (statusFilter === 'archived') {
      if (!task.archived) return false;
    } else {
      if (task.archived) return false;
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return task.title.toLowerCase().includes(q) || task.description.toLowerCase().includes(q);
    }
    return true;
  });

  filtered.sort((a, b) => {
    const getGroup = (t: ScoredTask) => {
      if (t.archived) return 3;
      if (t.status === 'done') return 2;
      return 1; // Active (todo / in_progress)
    };
    const groupA = getGroup(a);
    const groupB = getGroup(b);

    if (groupA !== groupB) return groupA - groupB;

    if (groupA === 1) {
      return b.priority_score - a.priority_score;
    }

    const timeA = new Date(a.completed_at || a.updated_at).getTime();
    const timeB = new Date(b.completed_at || b.updated_at).getTime();
    return timeB - timeA;
  });

  return (
    <div className="app-content" style={{ maxWidth: 720, margin: '0 auto', position: 'relative', paddingBottom: selectionMode && selectedIds.size > 0 ? 80 : 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>All Tasks</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${selectionMode ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) setSelectedIds(new Set());
            }}
            id="all-tasks-select-mode"
            aria-label="Toggle batch selection mode"
            style={{ fontSize: 13, padding: '6px 12px' }}
          >
            {selectionMode ? <CheckSquare size={14} /> : <Square size={14} />}
            {selectionMode ? 'Done Selecting' : 'Select'}
          </button>

          <button
            className="btn btn--primary"
            onClick={() => setShowNewTask(true)}
            id="all-tasks-new"
            aria-label="New task"
          >
            <Plus size={14} />
            New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input input--sm"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32 }}
            id="tasks-search"
            aria-label="Search tasks"
            autoComplete="off"
            autoCorrect="off"
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`btn btn--ghost${statusFilter === f.value ? ' active' : ''}`}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                background: statusFilter === f.value ? 'var(--accent-dim)' : undefined,
                color: statusFilter === f.value ? 'var(--accent)' : undefined,
                borderColor: statusFilter === f.value ? 'var(--accent)' : undefined,
              }}
              onClick={() => setStatusFilter(f.value)}
              id={`tasks-filter-${f.value}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Select all header bar */}
      {selectionMode && filtered.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface)', borderRadius: 'var(--radius)', marginBottom: 12, border: '1px solid var(--border)' }}>
          <button
            className="btn btn--ghost"
            style={{ fontSize: 12, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={handleSelectAll}
          >
            {selectedIds.size === filtered.length ? <CheckSquare size={14} color="var(--accent)" /> : <Square size={14} />}
            <span>{selectedIds.size === filtered.length ? 'Deselect All' : 'Select All'} ({filtered.length})</span>
          </button>
          <span className="text-muted text-xs">{selectedIds.size} selected</span>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">
            {statusFilter === 'archived'
              ? 'No archived tasks'
              : statusFilter === 'in_progress'
              ? 'No tasks in progress'
              : statusFilter === 'done'
              ? 'No completed tasks'
              : 'No tasks found'}
          </p>
          <p className="empty-state__desc">
            {search
              ? `No tasks match "${search}"`
              : statusFilter === 'archived'
              ? 'Tasks you archive will appear here.'
              : statusFilter === 'in_progress'
              ? 'Click "Start" on any task to mark it as in progress.'
              : 'Create a task to get started'}
          </p>
        </div>
      ) : (
        <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((task, i) => {
            const isSelected = selectedIds.has(task.id);
            return (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectionMode && (
                  <button
                    className="btn btn--icon"
                    onClick={() => toggleSelectTask(task.id)}
                    style={{ flexShrink: 0, padding: 6, color: isSelected ? 'var(--accent)' : 'var(--text-dim)' }}
                    aria-label={`Select task: ${task.title}`}
                  >
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                )}
                <div style={{ flex: 1 }}>
                  <TaskCard
                    task={task}
                    index={i}
                    onComplete={handleComplete}
                    onReopen={handleReopen}
                    onArchive={handleArchive}
                    onPin={pinTask}
                  />
                </div>
                {statusFilter === 'archived' && (
                  <button
                    className="btn btn--ghost"
                    onClick={() => handleUnarchive(task.id)}
                    aria-label="Restore task"
                    data-tooltip="Restore task"
                    style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                  >
                    <ArchiveRestore size={14} /> Restore
                  </button>
                )}
              </div>
            );
          })}
          <p className="text-muted text-xs" style={{ textAlign: 'right', marginTop: 8 }}>
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
              zIndex: 1000,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginRight: 4 }}>
              {selectedIds.size} selected
            </span>

            <button
              className="btn btn--ghost"
              style={{ fontSize: 12, padding: '4px 10px', gap: 6 }}
              onClick={handleBulkComplete}
              data-tooltip="Mark selected as complete"
            >
              <Check size={13} color="var(--success)" /> Complete
            </button>

            <button
              className="btn btn--ghost"
              style={{ fontSize: 12, padding: '4px 10px', gap: 6 }}
              onClick={() => setShowSectionPrompt(true)}
              data-tooltip="Move to another topic/section"
            >
              <FolderEdit size={13} color="var(--accent)" /> Reassign Topic
            </button>

            <button
              className="btn btn--ghost"
              style={{ fontSize: 12, padding: '4px 10px', gap: 6 }}
              onClick={handleBulkArchive}
              data-tooltip="Archive selected tasks"
            >
              <Archive size={13} /> Archive
            </button>

            <button
              className="btn btn--ghost"
              style={{ fontSize: 12, padding: '4px 10px', gap: 6, color: 'var(--danger)' }}
              onClick={handleBulkDelete}
              data-tooltip="Delete selected tasks"
            >
              <Trash2 size={13} /> Delete
            </button>

            <button
              className="btn btn--icon"
              style={{ padding: 4, marginLeft: 6 }}
              onClick={() => setSelectedIds(new Set())}
              data-tooltip="Clear selection"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reassign Topic Modal Dialog */}
      {showSectionPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={() => setShowSectionPrompt(false)}>
          <div className="card" style={{ width: 340, padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 8 }}>Reassign Topic</h3>
            <p className="text-muted text-xs" style={{ marginBottom: 14 }}>
              Enter new section/topic name for {selectedIds.size} selected tasks:
            </p>
            <input
              className="input input--sm"
              placeholder="e.g. Frontend, Backend, Docs"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              autoFocus
              autoComplete="off"
              style={{ marginBottom: 14 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn--ghost" onClick={() => setShowSectionPrompt(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleBulkReassign}>Reassign</button>
            </div>
          </div>
        </div>
      )}

      <NewTaskModal
        isOpen={showNewTask}
        onClose={() => { setShowNewTask(false); loadAll(); }}
        initialProjectId={activeProject?.id}
      />
    </div>
  );
}

