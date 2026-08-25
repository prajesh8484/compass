import { NavLink } from 'react-router-dom';
import { Home, FolderOpen, List, Settings, CheckCircle2 } from 'lucide-react';

const navItems = [
  { to: '/',         icon: Home,       label: 'Home',     id: 'nav-home' },
  { to: '/projects', icon: FolderOpen, label: 'Projects', id: 'nav-projects' },
  { to: '/tasks',    icon: List,       label: 'All Tasks',id: 'nav-tasks' },
  { to: '/completed',icon: CheckCircle2,label:'Completed',id: 'nav-completed' },
];

export function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="sidebar__group">
        {navItems.map(({ to, icon: Icon, label, id }) => (
          <NavLink
            key={to}
            to={to}
            id={id}
            end={to === '/'}
            className={({ isActive }) => `sidebar__item${isActive ? ' active' : ''}`}
            data-tooltip={label}
            data-tooltip-pos="right"
            aria-label={label}
          >
            <Icon size={18} strokeWidth={1.8} />
          </NavLink>
        ))}
      </div>

      <NavLink
        to="/settings"
        id="nav-settings"
        className={({ isActive }) => `sidebar__item${isActive ? ' active' : ''}`}
        data-tooltip="Settings"
        data-tooltip-pos="right"
        aria-label="Settings"
      >
        <Settings size={18} strokeWidth={1.8} />
      </NavLink>
    </nav>
  );
}
