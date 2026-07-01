import { useState } from 'react';
import { PageShell } from '../../components/Layout';
import { searchApi } from '../../api/search.api';
import { toast } from 'react-toastify';
import { Search, FileText, Users, FolderKanban, CheckCircle } from 'lucide-react';

const AdvancedSearch = () => {
  const [filters, setFilters] = useState({
    q: '',
    type: 'all',
    status: '',
    priority: '',
    date_from: '',
    date_to: '',
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!filters.q && !filters.status && !filters.priority && !filters.date_from) {
      toast.warning('Veuillez saisir au moins un critère');
      return;
    }
    setLoading(true);
    try {
      const response = await searchApi.search(filters);
      setResults(response.data);
      if (response.data.counts.total === 0) {
        toast.info('Aucun résultat trouvé');
      }
    } catch (error) {
      toast.error('❌ Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({ q: '', type: 'all', status: '', priority: '', date_from: '', date_to: '' });
    setResults(null);
  };

  const statusOptions = [
    { value: '', label: 'Tous' },
    { value: 'pending', label: '⏳ En attente' },
    { value: 'active', label: '🔄 En cours' },
    { value: 'completed', label: '✅ Terminé' },
    { value: 'cancelled', label: '❌ Annulé' },
  ];

  const priorityOptions = [
    { value: '', label: 'Toutes' },
    { value: 'low', label: '🟢 Basse' },
    { value: 'medium', label: '🔵 Moyenne' },
    { value: 'high', label: '🟠 Haute' },
    { value: 'urgent', label: '🔴 Urgente' },
  ];

  const typeOptions = [
    { value: 'all', label: 'Tout' },
    { value: 'projects', label: '📁 Projets' },
    { value: 'tasks', label: '✅ Tâches' },
    { value: 'users', label: '👤 Utilisateurs' },
  ];

  return (
    <PageShell
      active="البحث"
      title="🔍 Recherche avancée"
      subtitle="Recherche filtrée dans tous les modules"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-gray-700 text-sm mb-1 text-right">Recherche</label>
              <input
                type="text"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                placeholder="Saisissez un mot-clé..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-1 text-right">Type</label>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                {typeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-1 text-right">Statut</label>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                {statusOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-1 text-right">Priorité</label>
              <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                {priorityOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-1 text-right">Date début</label>
              <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-1 text-right">Date fin</label>
              <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>

          <div className="flex gap-3 mt-4 justify-end">
            <button type="button" onClick={resetFilters} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">🔄 Réinitialiser</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-[#1a5b3e] text-white rounded-lg hover:bg-[#0f3d28] transition-colors disabled:opacity-50 flex items-center gap-2">
              <Search className="w-4 h-4" /> {loading ? '⏳ Recherche...' : '🔍 Rechercher'}
            </button>
          </div>
        </form>
      </div>

      {results && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-700">Résultats ({results.counts?.total || 0})</h2>
            <span className="text-sm text-gray-400">
              {results.counts?.projects || 0} projets • {results.counts?.tasks || 0} tâches • {results.counts?.users || 0} utilisateurs
            </span>
          </div>

          {results.counts?.total === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-lg text-gray-500">Aucun résultat trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.results.projects && results.results.projects.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-gray-500" />
                    <h3 className="font-bold text-gray-700">Projets ({results.results.projects.length})</h3>
                  </div>
                  {results.results.projects.map((item) => (
                    <div key={item.id} className="px-4 py-3 border-b hover:bg-gray-50 flex items-center justify-between">
                      <div><div className="font-medium text-gray-800">{item.name_ar}</div><div className="text-sm text-gray-400">{item.description?.substring(0, 100)}</div></div>
                      <div className="text-sm text-gray-500">{item.status} • {item.progress}%</div>
                    </div>
                  ))}
                </div>
              )}

              {results.results.tasks && results.results.tasks.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <h3 className="font-bold text-gray-700">Tâches ({results.results.tasks.length})</h3>
                  </div>
                  {results.results.tasks.map((item) => (
                    <div key={item.id} className="px-4 py-3 border-b hover:bg-gray-50 flex items-center justify-between">
                      <div><div className="font-medium text-gray-800">{item.title_ar}</div><div className="text-sm text-gray-400">{item.status} • {item.priority} • 📅 {item.due_date}</div></div>
                      <div className="text-sm text-gray-500">{item.progress}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
};

export default AdvancedSearch;