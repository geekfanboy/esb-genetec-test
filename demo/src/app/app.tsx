import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { DataGridPage } from './pages/data-grid.page';
import { TimelinePage } from './pages/timeline.page';
import { cn } from '@org/components';
export function App() {
  return (
    <div>
      <nav>
        <ul className="flex space-x-2 p-6 text-lg font-bold">
          <li>
            <NavLink
              to="/data-grid"
              className={({ isActive }) =>
                cn(
                  'p-4 rounded-sm',
                  isActive ? 'text-white bg-slate-700' : 'hover:bg-slate-100',
                )
              }
            >
              Data Grid
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/timeline"
              className={({ isActive }) =>
                cn(
                  'p-4 rounded-sm',
                  isActive ? 'text-white bg-slate-700' : 'hover:bg-slate-100',
                )
              }
            >
              Timeline
            </NavLink>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="/data-grid" element={<DataGridPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="*" element={<Navigate to="/data-grid" replace />} />
      </Routes>
    </div>
  );
}

export default App;
