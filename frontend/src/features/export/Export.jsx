import { useState } from 'react';
import { PageShell } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { exportApi } from '../../api/export.api';
import { toast } from 'react-toastify';
import { FileSpreadsheet, Download, Users, FolderKanban, CheckCircle, BarChart3 } from 'lucide-react';

const Export = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [loading, setLoading] = useState({});

  const handleExport = async (type, filename) => {
    setLoading({ ...loading, [type]: true });
    try {
      let response;
      switch (type) {
        case 'projects': response = await exportApi.exportProjects(); break;
        case 'tasks': response = await exportApi.exportTasks(); break;
        case 'users': response = await exportApi.exportUsers(); break;
        case 'stats': response = await exportApi.exportStats(); break;
        default: return;
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`✅ Export ${filename} réussi`);
    } catch (error) {
      toast.error(`❌ Erreur lors de l'export ${filename}`);
    } finally {
      setLoading({ ...loading, [type]: false });
    }
  };

  const exportOptions = [
    { type: 'projects', label: '📁 Projets', description: 'Export de tous les projets avec leurs statuts et progressions', icon: FolderKanban, color: 'bg-blue-500', roles: ['admin', 'manager'] },
    { type: 'tasks', label: '✅ Tâches', description: 'Export de toutes les tâches avec leurs assignations et statuts', icon: CheckCircle, color: 'bg-orange-500', roles: ['admin', 'manager'] },
    { type: 'users', label: '👥 Utilisateurs', description: 'Export de tous les utilisateurs avec leurs rôles', icon: Users, color: 'bg-purple-500', roles: ['admin'] },
    { type: 'stats', label: '📊 Statistiques', description: 'Export des statistiques globales de la plateforme', icon: BarChart3, color: 'bg-green-500', roles: ['admin', 'manager'] },
  ];

  const hasAccess = (roles) => {
    if (isAdmin) return true;
    if (isManager && roles.includes('manager')) return true;
    return false;
  };

  return (
    <PageShell
      active="export"
      title="📊 Export Excel"
      subtitle="Exportez vos données en format Excel"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exportOptions.map((option) => (
          hasAccess(option.roles) && (
            <div key={option.type} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${option.color} rounded-xl flex items-center justify-center text-white text-2xl shrink-0`}>
                  <option.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{option.label}</h3>
                  <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                  <button
                    onClick={() => handleExport(option.type, option.type)}
                    disabled={loading[option.type]}
                    className="mt-4 bg-[#1a5b3e] text-white px-4 py-2 rounded-lg hover:bg-[#0f3d28] transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {loading[option.type] ? '⏳ Export...' : '📥 Télécharger Excel'}
                  </button>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-gray-800 mb-3">📋 Informations</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>✅ Les fichiers sont exportés au format Excel (.xlsx)</li>
          <li>✅ Les données sont formatées avec des couleurs</li>
          <li>✅ Les exports incluent les métadonnées (date, statut)</li>
          <li>✅ Les statistiques sont consolidées automatiquement</li>
        </ul>
      </div>
    </PageShell>
  );
};

export default Export;