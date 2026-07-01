import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { isAdmin, isManager } = useAuth();

const menuItems = [
  { path: '/dashboard', label: 'لوحة القيادة', icon: '🏠' },
  { path: '/axes', label: '📁 المحاور الاستراتيجية', icon: '📁' },  // <-- Ajouter
  { path: '/projects', label: 'المشاريع والأنشطة', icon: '📋' },
  { path: '/kanban', label: 'لوحة كانبان', icon: '📊' },
  { path: '/gantt', label: '📊 مخطط جانت', icon: '📊' },
  { path: '/calendar', label: 'التقويم', icon: '📅' },
  { path: '/messages', label: 'الرسائل', icon: '💬' },
  { path: '/documents', label: 'الوثائق', icon: '📄' },
  { path: '/correspondence', label: '📄 المراسلات', icon: '📄' },
  { path: '/reporting', label: 'التقارير', icon: '📈' },
  { path: '/search', label: '🔍 Recherche avancée', icon: '🔍' },
  { path: '/notifications', label: '🔔 الإشعارات', icon: '🔔' },
  { path: '/export', label: '📊 Export Excel', icon: '📊' },
];

  const adminMenu = [
    { path: '/admin/dashboard', label: '📊 لوحة التحكم', icon: '📊' },
    { path: '/admin/users', label: '👥 المستخدمين', icon: '👥' },
    { path: '/admin/categories', label: '🏷️ التصنيفات', icon: '🏷️' },
  ];

  return (
    <aside className="fixed right-0 top-16 h-full w-64 bg-white dark:bg-dark-bg shadow-lg overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {(isAdmin || isManager) && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
            <ul className="space-y-1">
              {adminMenu.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`
                    }
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;