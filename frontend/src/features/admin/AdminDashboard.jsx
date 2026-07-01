import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Users, FolderKanban, CheckCircle2, Clock, MessageSquare, FileText, AlertTriangle } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, admin: 0, manager: 0, member: 0 },
    projects: { total: 0, active: 0, completed: 0, pending: 0 },
    tasks: { total: 0, todo: 0, inProgress: 0, review: 0, done: 0, cancelled: 0 },
    messages: { unread: 0 },
    documents: { total: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        if (data.success) setStats(data.stats);
      } catch (error) {
        toast.error('❌ Erreur chargement stats');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5b3e]"></div>
      </div>
    );
  }

  const cards = [
    { label: '👥 Utilisateurs', value: stats.users.total, icon: Users, color: 'text-blue-600' },
    { label: '📁 Projets', value: stats.projects.total, icon: FolderKanban, color: 'text-primary-600' },
    { label: '✅ Tâches terminées', value: stats.tasks.done, icon: CheckCircle2, color: 'text-green-600' },
    { label: '⏳ Tâches en cours', value: stats.tasks.inProgress, icon: Clock, color: 'text-yellow-600' },
    { label: '💬 Messages non lus', value: stats.messages.unread, icon: MessageSquare, color: 'text-blue-600' },
    { label: '📄 Documents', value: stats.documents.total, icon: FileText, color: 'text-purple-600' },
  ];

  return (
    <PageShell
      active="لوحة التحكم"
      title="لوحة التحكم - الإدارة"
      subtitle="Statistiques et gestion de la plateforme"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center hover:shadow-md transition-shadow">
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-sm text-slate-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">📊 Utilisateurs par rôle</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">👑 Admins</span>
              <span className="font-bold text-red-600">{stats.users.admin || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">📋 Managers</span>
              <span className="font-bold text-blue-600">{stats.users.manager || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">👤 Membres</span>
              <span className="font-bold text-green-600">{stats.users.member || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">✅ Actifs</span>
              <span className="font-bold text-green-600">{stats.users.active || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">📋 Statut des tâches</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">📋 À faire</span>
              <span className="font-bold text-yellow-600">{stats.tasks.todo || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">🔄 En cours</span>
              <span className="font-bold text-blue-600">{stats.tasks.inProgress || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">🔍 Révision</span>
              <span className="font-bold text-purple-600">{stats.tasks.review || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">✅ Terminé</span>
              <span className="font-bold text-green-600">{stats.tasks.done || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">❌ Annulé</span>
              <span className="font-bold text-red-600">{stats.tasks.cancelled || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">📁 Statut des projets</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">⏳ En attente</span>
              <span className="font-bold text-yellow-600">{stats.projects.pending || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">🔄 Actifs</span>
              <span className="font-bold text-green-600">{stats.projects.active || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">✅ Terminés</span>
              <span className="font-bold text-blue-600">{stats.projects.completed || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">🔔 Alertes</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
              <span className="text-sm text-red-600">🔴 Tâches en retard</span>
              <span className="font-bold text-red-600">{stats.tasks.overdue || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <span className="text-sm text-yellow-600">⚠️ Messages non lus</span>
              <span className="font-bold text-yellow-600">{stats.messages.unread || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-sm text-blue-600">ℹ️ Utilisateurs inactifs</span>
              <span className="font-bold text-blue-600">{(stats.users.total || 0) - (stats.users.active || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default AdminDashboard;