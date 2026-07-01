import { NavLink } from 'react-router-dom';

const AdminSidebar = () => {
const menuItems = [
  { path: '/admin/dashboard', label: '📊 Tableau de bord', icon: '📊' },
  { path: '/admin/users', label: '👥 Utilisateurs', icon: '👥' },
  { path: '/admin/categories', label: '🏷️ Catégories', icon: '🏷️' },
  { path: '/admin/logs', label: '📋 Logs & Audit', icon: '📋' },
  { path: '/dashboard', label: '🏠 Retour', icon: '🏠' },
];

  return (
    <aside className="fixed right-0 top-16 h-full w-64 bg-white dark:bg-dark-bg shadow-lg overflow-y-auto">
      <nav className="p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">لوحة التحكم</div>
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
      </nav>
    </aside>
  );
};

export default AdminSidebar;