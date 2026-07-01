import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { projectApi } from '../../api/project.api';
import { axeApi } from '../../api/axe.api';
import { toast } from 'react-toastify';
import { Plus, Search, SlidersHorizontal, Calendar, Users, MoreVertical, LayoutGrid, List } from 'lucide-react';
import Pagination from '../../components/Pagination';

const Projects = () => {
  const { isAdmin, isManager } = useAuth();
  const [projects, setProjects] = useState([]);
  const [axes, setAxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [view, setView] = useState('cards');
  const [formData, setFormData] = useState({
    name_ar: '',
    description: '',
    axe_id: '',
    start_date: '',
    end_date: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState({ search: '', status: '' });

  const loadProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        status: filters.status,
      });
      const response = await projectApi.getAll(params);
      if (response.data && response.data.success !== false) {
        setProjects(response.data.projects || []);
        setPagination({
          ...pagination,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
          hasNext: response.data.pagination.hasNext,
          hasPrev: response.data.pagination.hasPrev,
        });
      }
    } catch (error) {
      toast.error('❌ Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const loadAxes = async () => {
    try {
      const response = await axeApi.getAll();
      setAxes(response.data.axes || []);
    } catch (error) {
      console.error('❌ Erreur chargement axes:', error);
    }
  };

  useEffect(() => {
    loadAxes();
    loadProjects();
  }, [pagination.page, pagination.limit, filters.search, filters.status]);

  const handlePageChange = (newPage) => setPagination({ ...pagination, page: newPage });
  const handleLimitChange = (newLimit) => setPagination({ ...pagination, page: 1, limit: newLimit });
  const handleSearch = (e) => { setFilters({ ...filters, search: e.target.value }); setPagination({ ...pagination, page: 1 }); };
  const handleStatusFilter = (e) => { setFilters({ ...filters, status: e.target.value }); setPagination({ ...pagination, page: 1 }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const projectData = {
        name_ar: formData.name_ar,
        description: formData.description || '',
        axe_id: formData.axe_id || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
      };
      if (editingProject) {
        await projectApi.update(editingProject.id, projectData);
        toast.success('✅ Projet mis à jour avec succès');
      } else {
        await projectApi.create(projectData);
        toast.success('✅ Projet créé avec succès');
      }
      setShowModal(false);
      setEditingProject(null);
      setFormData({ name_ar: '', description: '', axe_id: '', start_date: '', end_date: '' });
      loadProjects();
    } catch (error) {
      toast.error('❌ Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;
    try {
      await projectApi.delete(id);
      toast.success('✅ Projet supprimé avec succès');
      loadProjects();
    } catch (error) {
      toast.error('❌ Erreur lors de la suppression');
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name_ar: project.name_ar,
      description: project.description || '',
      axe_id: project.axe_id || '',
      start_date: project.start_date,
      end_date: project.end_date,
    });
    setShowModal(true);
  };

  const getAxeName = (axeId) => {
    if (!axeId) return 'بدون محور';
    const axe = axes.find(a => a.id === axeId);
    return axe ? axe.name_ar : 'بدون محور';
  };

  const getAxeColor = (axeId) => {
    if (!axeId) return '#9ca3af';
    const axe = axes.find(a => a.id === axeId);
    return axe ? axe.color : '#9ca3af';
  };

  const statusColors = { pending: 'bg-yellow-100 text-yellow-800', active: 'bg-green-100 text-green-800', completed: 'bg-blue-100 text-blue-800', cancelled: 'bg-red-100 text-red-800' };
  const statusLabels = { pending: 'قيد الانتظار', active: 'نشط', completed: 'مكتمل', cancelled: 'ملغى' };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5b3e]"></div>
      </div>
    );
  }

  return (
    <PageShell
      active="المشاريع والأنشطة"
      title="المشاريع والأنشطة"
      subtitle={`${pagination.total} مشاريع نشطة`}
    >
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
            <input
              type="text"
              placeholder="بحث عن مشروع..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#22c55e]/40"
            />
          </div>
          <select
            value={filters.status}
            onChange={handleStatusFilter}
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[#22c55e]/40 outline-none"
          >
            <option value="">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="active">نشط</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغى</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setView('cards')}
              className={`p-2 rounded-lg transition-colors ${view === 'cards' ? 'bg-[#1a5b3e] text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('table')}
              className={`p-2 rounded-lg transition-colors ${view === 'table' ? 'bg-[#1a5b3e] text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          {(isAdmin || isManager) && (
            <button
              onClick={() => { setEditingProject(null); setFormData({ name_ar: '', description: '', axe_id: '', start_date: '', end_date: '' }); setShowModal(true); }}
              className="flex items-center gap-2 bg-[#1a5b3e] hover:bg-[#0f3d28] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> مشروع جديد
            </button>
          )}
        </div>
      </div>

      {/* Vue cartes */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between gap-2">
                {project.axe_id && (
                  <span className="text-[11px] font-semibold text-white px-2 py-1 rounded-lg" style={{ backgroundColor: getAxeColor(project.axe_id) }}>
                    {getAxeName(project.axe_id)}
                  </span>
                )}
                <button className="text-slate-400 hover:text-slate-600 shrink-0"><MoreVertical className="w-4 h-4" /></button>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-3 leading-snug">{project.name_ar}</h3>
              {project.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{project.description}</p>}
              <div className="mt-4">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
                  {statusLabels[project.status] || project.status}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500">نسبة الإنجاز</span>
                  <span className="font-bold text-slate-800 tabular-nums" dir="ltr">{project.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#22c55e]" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {project.start_date}</span>
                <span>→</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {project.end_date}</span>
              </div>
              {(isAdmin || isManager) && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 justify-end">
                  <button onClick={() => handleEdit(project)} className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded hover:bg-blue-50 transition-colors">✏️ تعديل</button>
                  <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded hover:bg-red-50 transition-colors">🗑️ حذف</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vue tableau */}
      {view === 'table' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-slate-500 text-xs">
              <th className="text-right font-semibold px-5 py-3">المشروع</th>
              <th className="text-right font-semibold px-5 py-3">المحور</th>
              <th className="text-right font-semibold px-5 py-3">الحالة</th>
              <th className="text-right font-semibold px-5 py-3">نسبة الإنجاز</th>
              <th className="text-right font-semibold px-5 py-3">الفترة</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{p.name_ar}</td>
                  <td className="px-5 py-3.5 text-slate-500">{getAxeName(p.axe_id)}</td>
                  <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusColors[p.status] || 'bg-gray-100 text-gray-800'}`}>{statusLabels[p.status] || p.status}</span></td>
                  <td className="px-5 py-3.5"><div className="flex items-center gap-2 w-32"><div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-[#22c55e]" style={{ width: `${p.progress}%` }} /></div><span className="text-xs font-semibold text-slate-600 tabular-nums" dir="ltr">{p.progress}%</span></div></td>
                  <td className="px-5 py-3.5 text-slate-500">{p.start_date} → {p.end_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          limit={pagination.limit}
          onLimitChange={handleLimitChange}
          total={pagination.total}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingProject ? '✏️ تعديل المشروع' : '➕ مشروع جديد'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div><label className="block text-gray-700 text-sm mb-1 text-right">اسم المشروع *</label>
                  <input type="text" value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required dir="rtl" /></div>
                <div><label className="block text-gray-700 text-sm mb-1 text-right">المحور الاستراتيجي</label>
                  <select value={formData.axe_id} onChange={(e) => setFormData({ ...formData, axe_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">بدون محور</option>
                    {axes.map((axe) => (<option key={axe.id} value={axe.id}>{axe.code ? `[${axe.code}] ` : ''}{axe.name_ar}</option>))}
                  </select></div>
                <div><label className="block text-gray-700 text-sm mb-1 text-right">الوصف</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" rows="3" dir="rtl" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-gray-700 text-sm mb-1 text-right">تاريخ البداية *</label>
                    <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required /></div>
                  <div><label className="block text-gray-700 text-sm mb-1 text-right">تاريخ النهاية *</label>
                    <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required /></div>
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowModal(false); setEditingProject(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingProject ? 'تحديث' : 'إنشاء'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Projects;