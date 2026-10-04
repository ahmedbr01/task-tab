import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { logApi } from '../../api/log.api';
import { toast } from 'react-toastify';
import { FileText, Download, Trash2, Search, AlertCircle } from 'lucide-react';

const Logs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    action: '',
    username: '',
    dateFrom: '',
    dateTo: '',
    tableName: '',
  });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [stats, setStats] = useState(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: filters.limit,
        action: filters.action,
        username: filters.username,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        tableName: filters.tableName,
      };
      const response = await logApi.getAll(params);
      setLogs(response.data.logs || []);
      setPagination({
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      });
      setStats(response.data.stats);
    } catch (error) {
      toast.error('❌ Erreur chargement logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters.page, filters.limit]);

  const handlePageChange = (newPage) => setFilters({ ...filters, page: newPage });
  const handleFilter = () => { setFilters({ ...filters, page: 1 }); loadLogs(); };
  const handleReset = () => setFilters({ page: 1, limit: 50, action: '', username: '', dateFrom: '', dateTo: '', tableName: '' });

  const handleExport = async () => {
    try {
      const response = await logApi.export();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('✅ Logs exportés');
    } catch (error) {
      toast.error('❌ Erreur export');
    }
  };

  const handleClean = async () => {
    const days = prompt('Supprimer les logs de plus de combien de jours ? (30 par défaut)');
    if (!days) return;
    if (!window.confirm(`Supprimer les logs de plus de ${days} jours ?`)) return;
    try {
      await logApi.clean(parseInt(days));
      toast.success(`✅ Logs supprimés (plus de ${days} jours)`);
      loadLogs();
    } catch (error) {
      toast.error('❌ Erreur suppression');
    }
  };

  const getActionColor = (action) => {
    const colors = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      PATCH: 'bg-purple-100 text-purple-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5b3e]"></div>
      </div>
    );
  }

  return (
    <PageShell
      active="السجلات"
      title="📋 Logs & Audit"
      subtitle="Journalisation des actions système"
      right={
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
          <button onClick={handleClean} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            <Trash2 className="w-4 h-4" /> Nettoyer
          </button>
        </div>
      }
    >
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.today}</div>
            <div className="text-sm text-gray-500">Aujourd'hui</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.byAction?.find(a => a.action === 'POST')?.count || 0}</div>
            <div className="text-sm text-gray-500">Créations</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.byAction?.find(a => a.action === 'DELETE')?.count || 0}</div>
            <div className="text-sm text-gray-500">Suppressions</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Action</label>
            <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Toutes</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Utilisateur</label>
            <input type="text" value={filters.username} onChange={(e) => setFilters({ ...filters, username: e.target.value })} placeholder="Nom" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Table</label>
            <input type="text" value={filters.tableName} onChange={(e) => setFilters({ ...filters, tableName: e.target.value })} placeholder="Table" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Date début</label>
            <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Date fin</label>
            <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={handleReset} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">🔄 Réinitialiser</button>
          <button onClick={handleFilter} className="px-4 py-2 bg-[#1a5b3e] text-white rounded-lg hover:bg-[#0f3d28] transition-colors">🔍 Filtrer</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Utilisateur</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Action</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Table</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Record</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">IP</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">Aucun log trouvé</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(log.created_at).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.username || '-'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>{log.action}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.table_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.record_id || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.ip_address || '-'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${log.status >= 200 && log.status < 300 ? 'bg-green-100 text-green-800' : log.status >= 400 && log.status < 500 ? 'bg-yellow-100 text-yellow-800' : log.status >= 500 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{log.status || '-'}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">Total: {pagination.total} logs</div>
          <div className="flex gap-2">
            <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50">‹ Précédent</button>
            <span className="px-3 py-1">Page {filters.page} sur {pagination.totalPages}</span>
            <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === pagination.totalPages} className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50">Suivant ›</button>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Logs;