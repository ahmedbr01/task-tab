import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell';
import { Bell, Search, ChevronDown, LogOut, User, Settings, LayoutGrid } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const { isConnected, onlineUsers } = useSocket();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount, isPushEnabled, subscribeToPush, unsubscribeFromPush } = useNotifications();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const closeDropdown = () => {
    setShowDropdown(false);
  };


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


  const renderAvatar = (size = 'w-8 h-8') => {
    if (!user) return null;

    // Vérifier si l'utilisateur a un avatar
    const hasAvatar = user.avatar && user.avatar !== 'null' && user.avatar !== '';

    if (hasAvatar) {
      // Construire l'URL complète
      let avatarUrl = user.avatar;
      if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/uploads')) {
        avatarUrl = `/uploads/${avatarUrl}`;
      }

      return (
        <img
          src={avatarUrl}
          alt={user.full_name || user.username}
          className={`${size} rounded-full object-cover`}
          onError={(e) => {
            // En cas d'erreur, afficher les initiales
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            const initials = document.createElement('div');
            initials.className = `${size} rounded-full bg-[#1a5b3e] flex items-center justify-center text-white font-bold text-xs`;
            initials.textContent = getInitials();
            parent.appendChild(initials);
          }}
        />
      );
    }

    // Fallback : initiales
    return (
      <div className={`${size} rounded-full bg-[#1a5b3e] flex items-center justify-center text-white font-bold text-sm`}>
        {getInitials()}
      </div>
    );
  };

  return (
    <header className="fixed top-0 right-64 left-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Titre à gauche */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">TASK TAB</h1>
          <p className="text-xs text-slate-500 mt-0.5">منصة المتابعة والقيادة</p>
        </div>

        {/* Actions à droite */}
        <div className="flex items-center gap-3">
          {/* Indicateur de connexion Socket */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs text-slate-500">
              {isConnected ? `${onlineUsers.length} متصل` : 'غير متصل'}
            </span>
          </div>

          {/* Barre de recherche */}
          <div className="relative hidden lg:block">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
            <input
              type="text"
              placeholder="بحث..."
              aria-label="بحث"
              className="bg-slate-100 text-sm rounded-xl pr-9 pl-4 py-2 w-48 focus:w-64 transition-all outline-none focus:ring-2 focus:ring-[#22c55e]/40 placeholder:text-slate-400"
            />
          </div>

          {/* Bouton thème */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title={isDark ? 'Mode clair' : 'Mode sombre'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Bouton notifications push */}
          <button
            onClick={isPushEnabled ? unsubscribeFromPush : subscribeToPush}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title={isPushEnabled ? 'Désactiver notifications push' : 'Activer notifications push'}
          >
            {isPushEnabled ? '🔔' : '🔕'}
          </button>

          {/* Notifications */}
          <Link
            to="/notifications"
            className="relative w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            aria-label="الإشعارات"
          >
            <Bell className="w-[18px] h-[18px] text-slate-600" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -left-1 bg-[#ef4444] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* ============================================ */}
          {/* 🔥 PROFIL UTILISATEUR AVEC AVATAR */}
          {/* ============================================ */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
              aria-expanded={showDropdown}
            >
              <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
              {renderAvatar('w-8 h-8')}
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                {/* Informations utilisateur avec avatar */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                  {renderAvatar('w-10 h-10')}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">
                      {user?.full_name || user?.username}
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                      {user?.email}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {user?.role === 'admin' ? '👑 Administrateur' : 
                       user?.role === 'manager' ? '📋 Manager' : 
                       '👤 Membre'}
                    </div>
                  </div>
                </div>

                {/* Liens du dropdown */}
                <Link
                  to="/profile"
                  onClick={closeDropdown}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Mon profil</span>
                </Link>

                <Link
                  to="/dashboard"
                  onClick={closeDropdown}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Tableau de bord</span>
                </Link>

                <Link
                  to="/search"
                  onClick={closeDropdown}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Recherche avancée</span>
                </Link>

                <Link
                  to="/notifications"
                  onClick={closeDropdown}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    onClick={closeDropdown}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Administration</span>
                  </Link>
                )}

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={() => {
                    closeDropdown();
                    handleLogout();
                  }}
                  className="flex items-center gap-3 px-4 py-2 w-full text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;