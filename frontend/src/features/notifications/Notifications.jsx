import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { useNotifications } from '../../context/NotificationContext';
import { CheckCheck, ListTodo, Clock, MessageSquare, AlertTriangle, Calendar } from 'lucide-react';

const typeMeta = {
  task_assigned: { icon: ListTodo, color: '#3b82f6', label: 'إسناد مهمة' },
  deadline: { icon: Clock, color: '#f59e0b', label: 'اقتراب أجل' },
  task_updated: { icon: AlertTriangle, color: '#ef4444', label: 'تحديث مهمة' },
  message: { icon: MessageSquare, color: '#1a5b3e', label: 'رسالة' },
  system: { icon: Calendar, color: '#64748b', label: 'نظام' },
};

const Notifications = () => {
  const { notifications, loadNotifications, markAsRead, markAllAsRead, loading, unreadCount } = useNotifications();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 30) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('fr-FR');
  };

  const filteredNotifications = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5b3e]"></div>
      </div>
    );
  }

  return (
    <PageShell
      active=""
      title="الإشعارات"
      subtitle={`${unreadCount} إشعارات غير مقروءة`}
      right={
        <button
          onClick={markAllAsRead}
          className="flex items-center gap-2 text-sm font-semibold text-[#1a5b3e] bg-[#1a5b3e]/10 hover:bg-[#1a5b3e]/15 px-3.5 py-2.5 rounded-xl transition-colors"
        >
          <CheckCheck className="w-4 h-4" /> تحديد الكل كمقروء
        </button>
      }
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-1 px-4 pt-3">
          <button onClick={() => setFilter('all')} className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors ${filter === 'all' ? 'bg-[#1a5b3e]/10 text-[#1a5b3e]' : 'text-slate-400 hover:text-slate-600'}`}>
            الكل ({notifications.length})
          </button>
          <button onClick={() => setFilter('unread')} className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors ${filter === 'unread' ? 'bg-[#1a5b3e]/10 text-[#1a5b3e]' : 'text-slate-400 hover:text-slate-600'}`}>
            غير مقروءة ({unreadCount})
          </button>
        </div>

        <ul className="divide-y divide-slate-50 mt-2">
          {filteredNotifications.map((n) => {
            const meta = typeMeta[n.type] || typeMeta.system;
            const Icon = meta.icon;
            return (
              <li key={n.id} className={`flex items-start gap-3.5 px-5 py-4 transition-colors ${n.read ? 'bg-white' : 'bg-[#1a5b3e]/[0.04]'}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.color}1A` }}>
                  <Icon className="w-4 h-4" style={{ color: meta.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}>
                      {meta.label}
                    </span>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#1a5b3e]" />}
                  </div>
                  <p className={`text-sm mt-1.5 ${n.read ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>{n.title}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{formatDate(n.created_at)}</p>
                </div>
                {!n.read && (
                  <button onClick={() => markAsRead(n.id)} className="text-[11px] font-semibold text-[#1a5b3e] hover:underline shrink-0 whitespace-nowrap">
                    تحديد كمقروء
                  </button>
                )}
              </li>
            );
          })}
          {filteredNotifications.length === 0 && (
            <li className="py-12 text-center text-sm text-slate-400">لا توجد إشعارات</li>
          )}
        </ul>
      </div>
    </PageShell>
  );
};

export default Notifications;