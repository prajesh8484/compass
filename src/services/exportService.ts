import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { projectRepository } from '../repositories/projectRepository';
import { taskRepository } from '../repositories/taskRepository';
import { APP_CONSTANTS } from '../config/constants';

/** Persist text via the native save dialog. Returns false if the user cancelled. */
async function saveTextFile(defaultName: string, filterName: string, extension: string, contents: string): Promise<boolean> {
  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: filterName, extensions: [extension] }],
  });
  if (!path) return false;
  await writeTextFile(path, contents);
  return true;
}

export const exportService = {
  /**
   * Export all database content (projects, tasks, settings) as a JSON snapshot
   * saved through the native save dialog.
   */
  async exportAllDataAsJson(): Promise<boolean> {
    const projects = await projectRepository.getAll();
    const tasks = await taskRepository.getAll();
    const settings = await projectRepository.getSettings();

    const payload = {
      app: APP_CONSTANTS.APP_NAME,
      version: APP_CONSTANTS.APP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        projects,
        tasks,
        settings,
      },
    };

    return saveTextFile(
      `compass-backup-${new Date().toISOString().split('T')[0]}.json`,
      'JSON',
      'json',
      JSON.stringify(payload, null, 2),
    );
  },

  /**
   * Export project tasks and topics as a clean Markdown summary document
   * saved through the native save dialog.
   */
  async exportProjectAsMarkdown(projectId?: string): Promise<boolean> {
    const projects = await projectRepository.getAll();
    const tasks = await taskRepository.getAll();

    const targetProjects = projectId
      ? projects.filter((p) => p.id === projectId)
      : projects;

    let md = `# Compass Workspace Summary\n\nGenerated on: ${new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}\n\n---\n\n`;

    for (const project of targetProjects) {
      const projectTasks = tasks.filter((t) => t.project_id === project.id);
      md += `## 📁 Project: ${project.name}\n\n`;

      if (project.folder_path) {
        md += `*Path: \`${project.folder_path}\`*\n\n`;
      }

      const sections = Array.from(new Set(projectTasks.map((t) => t.section || 'General')));

      for (const sec of sections) {
        const secTasks = projectTasks.filter((t) => (t.section || 'General') === sec);
        md += `### ${sec}\n\n`;

        for (const task of secTasks) {
          const check = task.status === 'done' ? '[x]' : '[ ]';
          const deadline = task.deadline ? ` (Due: ${task.deadline})` : '';
          const est = task.estimated_minutes ? ` [${task.estimated_minutes}m]` : '';
          md += `- ${check} **${task.title}**${est}${deadline}\n`;
          if (task.description) {
            md += `  > ${task.description.replace(/\n/g, ' ')}\n`;
          }
        }
        md += '\n';
      }
      md += '---\n\n';
    }

    return saveTextFile(
      `compass-summary-${new Date().toISOString().split('T')[0]}.md`,
      'Markdown',
      'md',
      md,
    );
  },
};
