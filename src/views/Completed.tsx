import { useEffect, useState } from 'react';
import { taskService } from '../services/taskService';
import { useTaskStore } from '../stores/useTaskStore';
import { TaskCard } from '../components/tasks/TaskCard';
import { VelocityChart } from '../components/analytics/VelocityChart';
import { TopicBreakdown } from '../components/analytics/TopicBreakdown';
import type { ScoredTask, Task } from '../lib/types';

export function Completed() {
  const [completedTasks, setCompletedTasks] = useState<ScoredTask[]>([]);
  const { reopenTask, archiveTask } = useTaskStore();

  const fetchCompleted = async () => {
    try {
      const tasks: Task[] = await taskService.getCompletedTasks();
      const scored: ScoredTask[] = tasks.map((t) => ({
        ...t,
        priority_score: 0,
        isBlocked: false,
        breakdown: {
          importance: 0,
          deadline: 0,
          estimatedTime: 0,
          difficulty: 0,
          projectHealth: 0,
          manualBoost: 0,
          longTerm: 0,
          aging: 0,
          context: 0,
          total: 0,
        },
      }));
      scored.sort((a, b) => new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime());
      setCompletedTasks(scored);
    } catch (err) {
      console.error('Failed to load completed tasks', err);
    }
  };

  useEffect(() => {
    fetchCompleted();
  }, []);

  const handleReopen = async (id: string) => {
    setCompletedTasks((prev) => prev.filter((t) => t.id !== id));
    await reopenTask(id);
  };

  const handleArchive = async (id: string) => {
    setCompletedTasks((prev) => prev.filter((t) => t.id !== id));
    await archiveTask(id);
  };

  return (
    <div className="app-content" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2>Completed</h2>
        <p className="text-muted text-sm" style={{ marginTop: 4 }}>
          Tasks you have successfully finished.
        </p>
      </div>

      {/* Analytics Dashboard Header */}
      {completedTasks.length > 0 && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
          <VelocityChart completedTasks={completedTasks} />
          <TopicBreakdown completedTasks={completedTasks} />
        </div>
      )}

      {completedTasks.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">No completed tasks</p>
          <p className="empty-state__desc">Your finished work will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {completedTasks.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task as any}
              index={i}
              onReopen={handleReopen}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
