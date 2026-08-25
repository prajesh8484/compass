import { Routes, Route } from 'react-router-dom';
import { Home } from '../views/Home';
import { Projects } from '../views/Projects';
import { AllTasks } from '../views/AllTasks';
import { Settings } from '../views/Settings';
import { Completed } from '../views/Completed';
import { ProjectDetail } from '../views/ProjectDetail';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/"              element={<Home />} />
      <Route path="/projects"      element={<Projects />} />
      <Route path="/projects/:id"  element={<ProjectDetail />} />
      <Route path="/tasks"         element={<AllTasks />} />
      <Route path="/completed"     element={<Completed />} />
      <Route path="/settings"      element={<Settings />} />
    </Routes>
  );
}
