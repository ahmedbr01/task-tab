import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  LogOut, User, Settings, Bell, LayoutGrid, Search, 
  ChevronDown, Home, FolderKanban, Calendar, MessageSquare, 
  FileText, GanttChart, Database, BarChart3, Users, 
  Tag, ScrollText, Menu, X, Award 
} from 'lucide-react';
import { toast } from 'react-toastify';

// ============================================
// COMPOSANT PAGE SHELL
// ============================================
export const PageShell = ({ children, title, subtitle }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
};

// ============================================
// LAYOUT PRINCIPAL
// ============================================
const Layout = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('✅ Déconnecté avec succès');
  };

  // ============================================
  // FONCTIONS AVATAR
  // ============================================
  const getInitials = () => {
    if (!user) return 'U';
    if (user.full_name) {
      const names = user.full_name.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return user.full_name[0].toUpperCase();
    }
    return user.username?.[0]?.toUpperCase() || 'U';
  };

  const renderAvatar = (size = 'w-8 h-8', textSize = 'text-xs') => {
    if (!user) return null;

    const hasAvatar = user.avatar && user.avatar !== 'null' && user.avatar !== '';

    if (hasAvatar) {
      let avatarUrl = user.avatar;
      if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/uploads')) {
        avatarUrl = `/uploads/${avatarUrl}`;
      }

      return (
        <img
          src={avatarUrl}
          alt={user.full_name || user.username}
          className={`${size} rounded-full object-cover border-2 border-white shadow-sm`}
          onError={(e) => {
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            const initials = document.createElement('div');
            initials.className = `${size} rounded-full bg-gradient-to-br from-[#1a5b3e] to-[#2d8b5e] flex items-center justify-center text-white font-bold ${textSize}`;
            initials.textContent = getInitials();
            parent.appendChild(initials);
          }}
        />
      );
    }

    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-[#1a5b3e] to-[#2d8b5e] flex items-center justify-center text-white font-bold ${textSize} shadow-sm`}>
        {getInitials()}
      </div>
    );
  };

  // ============================================
  // ITEMS DU MENU
  // ============================================
  const menuItems = [
    { path: '/dashboard', icon: <Home className="w-4 h-4" />, label: 'لوحة القيادة' },
    { path: '/projects', icon: <FolderKanban className="w-4 h-4" />, label: 'المشاريع' },
    { path: '/kanban', icon: <LayoutGrid className="w-4 h-4" />, label: 'لوحة كانبان' },
    { path: '/gantt', icon: <GanttChart className="w-4 h-4" />, label: 'مخطط جانت' },
    { path: '/messages', icon: <MessageSquare className="w-4 h-4" />, label: 'الرسائل' },
    { path: '/calendar', icon: <Calendar className="w-4 h-4" />, label: 'التقويم' },
    { path: '/documents', icon: <FileText className="w-4 h-4" />, label: 'الوثائق' },
    { path: '/correspondence', icon: <FileText className="w-4 h-4" />, label: 'المراسلات' },
    { path: '/axes', icon: <Database className="w-4 h-4" />, label: 'المحاور' },
    { path: '/search', icon: <Search className="w-4 h-4" />, label: 'بحث متقدم' },
    { path: '/export', icon: <BarChart3 className="w-4 h-4" />, label: 'تصدير' },
  ];

  const adminItems = [
    { path: '/admin/dashboard', icon: <LayoutGrid className="w-4 h-4" />, label: 'لوحة التحكم' },
    { path: '/admin/users', icon: <Users className="w-4 h-4" />, label: 'المستخدمين' },
    { path: '/admin/categories', icon: <Tag className="w-4 h-4" />, label: 'التصنيفات' },
    { path: '/admin/logs', icon: <ScrollText className="w-4 h-4" />, label: 'السجلات' },
    { path: '/admin/settings', icon: <Settings className="w-4 h-4" />, label: 'الإعدادات' },
  ];

  const isActive = (path) => {
    return window.location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ============================================ */}
      {/* HEADER - Moderne et compact */}
      {/* ============================================ */}
      <header className="bg-white border-b border-slate-200/80 px-4 py-2 flex items-center justify-between sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1a5b3e] to-[#2d8b5e] flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow">
              T
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-[#1a5b3e] leading-none">TASK TAB</h1>
              <p className="text-[8px] text-slate-400 leading-none">منصة المتابعة والقيادة</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <Link
            to="/notifications"
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4.5 h-4.5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Profil */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              {renderAvatar('w-7 h-7', 'text-xs')}
              <div className="text-right hidden md:block">
                <p className="text-xs font-medium text-slate-800 leading-tight">
                  {user?.full_name?.split(' ')[0] || user?.username}
                </p>
                <p className="text-[8px] text-slate-400 leading-tight">
                  {user?.role === 'admin' ? 'Administrateur' : 
                   user?.role === 'manager' ? 'Manager' : 'Membre'}
                </p>
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                <div className="absolute left-0 mt-1.5 w-56 bg-white rounded-lg shadow-xl border border-slate-200/80 py-1 z-50">
                  <div className="px-3 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
                    {renderAvatar('w-9 h-9', 'text-sm')}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {user?.full_name || user?.username}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {user?.email}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {user?.role === 'admin' && '👑 Administrateur'}
                        {user?.role === 'manager' && '📋 Manager'}
                        {user?.role === 'user' && '👤 Membre'}
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Mon profil</span>
                  </Link>

                  <Link
                    to="/notifications"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
                  </Link>

                  {user?.role === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Administration</span>
                    </Link>
                  )}

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-1.5 w-full text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* CONTENU PRINCIPAL AVEC SIDEBAR */}
      {/* ============================================ */}
      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-56 bg-white border-l border-slate-200/80
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:block min-h-[calc(100vh-52px)] overflow-y-auto py-3 px-2
          shadow-lg lg:shadow-none
        `}>
          <div className="lg:hidden px-3 py-2 border-b border-slate-100 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1a5b3e] to-[#2d8b5e] flex items-center justify-center text-white font-bold text-xs">
                T
              </div>
              <div>
                <p className="text-sm font-bold text-[#1a5b3e] leading-none">TASK TAB</p>
                <p className="text-[8px] text-slate-400 leading-none">منصة المتابعة والقيادة</p>
              </div>
            </div>
          </div>

          <nav className="space-y-0.5">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200
                  ${isActive(item.path)
                    ? 'bg-[#1a5b3e] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                  }
                `}
              >
                <span className={isActive(item.path) ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive(item.path) && (
                  <span className="ml-auto w-1 h-6 rounded-full bg-white/50"></span>
                )}
              </Link>
            ))}

            {user?.role === 'admin' && (
              <>
                <div className="border-t border-slate-200 my-2.5"></div>
                <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                  Administration
                </p>
                {adminItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200
                      ${isActive(item.path)
                        ? 'bg-[#1a5b3e] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                      }
                    `}
                  >
                    <span className={isActive(item.path) ? 'text-white' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {isActive(item.path) && (
                      <span className="ml-auto w-1 h-6 rounded-full bg-white/50"></span>
                    )}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-5 max-w-6xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;