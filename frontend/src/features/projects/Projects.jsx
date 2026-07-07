import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { projectApi } from '../../api/project.api';
import { axeApi } from '../../api/axe.api';
import { toast } from 'react-toastify';
import { Plus, Search, Calendar, MoreVertical, LayoutGrid, List, Wallet, AlertCircle } from 'lucide-react';
import Pagination from '../../components/Pagination';

const Projects = () => {
  const { user, isAdmin, isManager } = useAuth();
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
    budget_cost: '',
  });
  const [budgetCheck, setBudgetCheck] = useState({
    remaining: 0,
    currency: 'TND',
    isValid: true,
    message: '',
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
      console.error('❌ Erreur chargement projets:', error);
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

  // ============================================
  // VÉRIFICATION DU BUDGET EN TEMPS RÉEL
  // ============================================
  const checkBudget = (axeId, budgetCost, excludeProjectId = null) => {
    if (!axeId || !budgetCost || parseFloat(budgetCost) <= 0) {
      setBudgetCheck({
        remaining: 0,
        currency: 'TND',
        isValid: true,
        message: '',
      });
      return;
    }

    const axe = axes.find(a => a.id === parseInt(axeId));
    if (!axe) {
      setBudgetCheck({
        remaining: 0,
        currency: 'TND',
        isValid: false,
        message: 'Axe non trouvé',
      });
      return;
    }

    if (!axe.budget_total || axe.budget_total <= 0) {
      setBudgetCheck({
        remaining: 0,
        currency: axe.budget_currency || 'TND',
        isValid: false,
        message: 'Cet axe n\'a pas de budget défini',
      });
      return;
    }

    // Calculer le budget utilisé (en excluant le projet en cours si modification)
    let usedAmount = parseFloat(axe.budget_used || 0);
    if (excludeProjectId) {
      const project = projects.find(p => p.id === excludeProjectId);
      if (project) {
        usedAmount -= parseFloat(project.budget_cost || 0);
      }
    }

    const remaining = parseFloat(axe.budget_total) - usedAmount;
    const requested = parseFloat(budgetCost);
    const isValid = requested <= remaining;

    setBudgetCheck({
      remaining: remaining,
      currency: axe.budget_currency || 'TND',
      isValid: isValid,
      message: isValid 
        ? `✅ Budget suffisant. Reste: ${(remaining - requested).toFixed(2)} ${axe.budget_currency || 'TND'}`
        : `❌ Budget insuffisant. Disponible: ${remaining.toFixed(2)} ${axe.budget_currency || 'TND'}`,
    });
  };

  // ============================================
  // SURVEILLER LES CHANGEMENTS DU FORMULAIRE
  // ============================================
  useEffect(() => {
    if (formData.axe_id && formData.budget_cost) {
      checkBudget(
        formData.axe_id, 
        formData.budget_cost, 
        editingProject ? editingProject.id : null
      );
    } else {
      setBudgetCheck({
        remaining: 0,
        currency: 'TND',
        isValid: true,
        message: '',
      });
    }
  }, [formData.axe_id, formData.budget_cost, editingProject]);

  const handlePageChange = (newPage) => setPagination({ ...pagination, page: newPage });
  const handleLimitChange = (newLimit) => setPagination({ ...pagination, page: 1, limit: newLimit });
  const handleSearch = (e) => { setFilters({ ...filters, search: e.target.value }); setPagination({ ...pagination, page: 1 }); };
  const handleStatusFilter = (e) => { setFilters({ ...filters, status: e.target.value }); setPagination({ ...pagination, page: 1 }); };

  // ============================================
  // SOUMISSION DU FORMULAIRE AVEC VÉRIFICATION
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🔥 VÉRIFICATION FINALE DU BUDGET AVANT SOUMISSION
    if (formData.axe_id && formData.budget_cost && parseFloat(formData.budget_cost) > 0) {
      if (!budgetCheck.isValid) {
        toast.error(
          <div>
            <strong>❌ Budget insuffisant</strong>
            <br />
            {budgetCheck.message}
            <br />
            <span className="text-sm">💰 Solde disponible: {budgetCheck.remaining.toFixed(2)} {budgetCheck.currency}</span>
          </div>
        );
        return;
      }
    }

    try {
      const projectData = {
        name_ar: formData.name_ar,
        description: formData.description || '',
        axe_id: formData.axe_id || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        budget_cost: parseFloat(formData.budget_cost) || 0,
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
      setFormData({ 
        name_ar: '', 
        description: '', 
        axe_id: '', 
        start_date: '', 
        end_date: '',
        budget_cost: '',
      });
      setBudgetCheck({
        remaining: 0,
        currency: 'TND',
        isValid: true,
        message: '',
      });
      loadProjects();
    } catch (error) {
      console.error('❌ Erreur enregistrement:', error);
      
      // 🔥 AFFICHAGE DU MESSAGE D'ERREUR AMÉLIORÉ
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'enregistrement';
      const available = error.response?.data?.available;
      const currency = error.response?.data?.currency || 'TND';
      
      if (error.response?.data?.message?.includes('Budget insuffisant') || 
          error.response?.data?.message?.includes('budget')) {
        toast.error(
          <div>
            <strong>❌ Budget insuffisant</strong>
            <br />
            {errorMessage}
            {/* 🔥 CORRECTION : Vérifier que available est un nombre */}
            {available !== undefined && available !== null && (
              <>
                <br />
                <span className="text-sm">💰 Solde disponible: {Number(available).toFixed(2)} {currency}</span>
              </>
            )}
          </div>
        );
      } else {
        toast.error(`❌ ${errorMessage}`);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;
    try {
      await projectApi.delete(id);
      toast.success('✅ Projet supprimé avec succès');
      loadProjects();
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
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
      budget_cost: project.budget_cost || '',
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

  const getAxeBudgetInfo = (axeId) => {
    if (!axeId) return null;
    const axe = axes.find(a => a.id === axeId);
    if (!axe || !axe.budget_total || axe.budget_total <= 0) return null;
    const remaining = axe.budget_total - axe.budget_used;
    return {
      remaining,
      total: axe.budget_total,
      currency: axe.budget_currency || 'TND',
    };
  };

  const formatBudget = (project) => {
    if (!project.budget_cost || project.budget_cost <= 0) return null;
    const axe = axes.find(a => a.id === project.axe_id);
    const currency = axe?.budget_currency || 'TND';
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
        <Wallet className="w-3 h-3" />
        {project.budget_cost.toLocaleString()} {currency}
      </span>
    );
  };

  const statusColors = { 
    pending: 'bg-yellow-100 text-yellow-800', 
    active: 'bg-green-100 text-green-800', 
    completed: 'bg-blue-100 text-blue-800', 
    cancelled: 'bg-red-100 text-red-800' 
  };
  const statusLabels = { 
    pending: 'قيد الانتظار', 
    active: 'نشط', 
    completed: 'مكتمل', 
    cancelled: 'ملغى' 
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
              onClick={() => { 
                setEditingProject(null); 
                setFormData({ 
                  name_ar: '', 
                  description: '', 
                  axe_id: '', 
                  start_date: '', 
                  end_date: '',
                  budget_cost: '',
                }); 
                setBudgetCheck({
                  remaining: 0,
                  currency: 'TND',
                  isValid: true,
                  message: '',
                });
                setShowModal(true); 
              }}
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
              
              {/* 🔥 AFFICHAGE DU BUDGET DU PROJET */}
              <div className="mt-2">
                {formatBudget(project)}
              </div>
              
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs">
                  <th className="text-right font-semibold px-5 py-3">المشروع</th>
                  <th className="text-right font-semibold px-5 py-3">المحور</th>
                  <th className="text-right font-semibold px-5 py-3">الميزانية</th>
                  <th className="text-right font-semibold px-5 py-3">الحالة</th>
                  <th className="text-right font-semibold px-5 py-3">نسبة الإنجاز</th>
                  <th className="text-right font-semibold px-5 py-3">الفترة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => {
                  const axe = axes.find(a => a.id === p.axe_id);
                  const currency = axe?.budget_currency || 'TND';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{p.name_ar}</td>
                      <td className="px-5 py-3.5 text-slate-500">{getAxeName(p.axe_id)}</td>
                      <td className="px-5 py-3.5 text-slate-600" dir="ltr">
                        {p.budget_cost && p.budget_cost > 0 ? (
                          <span className="flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5 text-slate-400" />
                            {p.budget_cost.toLocaleString()} {currency}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusColors[p.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[p.status] || p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 w-32">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-[#22c55e]" style={{ width: `${p.progress}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 tabular-nums" dir="ltr">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{p.start_date} → {p.end_date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingProject ? '✏️ تعديل المشروع' : '➕ مشروع جديد'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm mb-1 text-right">اسم المشروع *</label>
                  <input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    dir="rtl"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm mb-1 text-right">المحور الاستراتيجي</label>
                  <select
                    value={formData.axe_id}
                    onChange={(e) => {
                      const newAxeId = e.target.value;
                      setFormData({ ...formData, axe_id: newAxeId });
                      if (newAxeId && formData.budget_cost) {
                        checkBudget(newAxeId, formData.budget_cost, editingProject ? editingProject.id : null);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">بدون محور</option>
                    {axes.map((axe) => {
                      const remaining = (axe.budget_total || 0) - (axe.budget_used || 0);
                      return (
                        <option key={axe.id} value={axe.id}>
                          {axe.code ? `[${axe.code}] ` : ''}{axe.name_ar}
                          {axe.budget_total > 0 && ` (💰 ${remaining.toFixed(0)} ${axe.budget_currency || 'TND'} restant)`}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm mb-1 text-right">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows="3"
                    dir="rtl"
                  />
                </div>

                {/* 🔥 CHAMP BUDGET DU PROJET AVEC VÉRIFICATION EN TEMPS RÉEL */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 text-right">💰 الميزانية المطلوبة</h4>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1 text-right">تكلفة المشروع</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.budget_cost}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, budget_cost: value });
                          if (formData.axe_id && value) {
                            checkBudget(formData.axe_id, value, editingProject ? editingProject.id : null);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                        dir="ltr"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">أدخل المبلغ المطلوب للمشروع</span>
                        {formData.axe_id && (() => {
                          const axe = axes.find(a => a.id === parseInt(formData.axe_id));
                          if (axe && axe.budget_total > 0) {
                            const remaining = axe.budget_total - axe.budget_used;
                            return (
                              <span className="text-xs text-gray-500">
                                المتبقي: {remaining.toFixed(0)} {axe.budget_currency || 'TND'}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    
                    {/* 🔥 AFFICHAGE DU STATUT DU BUDGET EN TEMPS RÉEL */}
                    {formData.axe_id && formData.budget_cost && parseFloat(formData.budget_cost) > 0 && (
                      <div className={`mt-2 text-xs font-semibold p-2 rounded-lg ${
                        budgetCheck.isValid 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          {budgetCheck.isValid ? '✅' : '❌'}
                          <span>{budgetCheck.message}</span>
                        </div>
                        {!budgetCheck.isValid && (
                          <div className="mt-1 text-xs text-red-600">
                            ⚠️ Le montant demandé dépasse le budget disponible.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm mb-1 text-right">تاريخ البداية *</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1 text-right">تاريخ النهاية *</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { 
                    setShowModal(false); 
                    setEditingProject(null);
                    setBudgetCheck({
                      remaining: 0,
                      currency: 'TND',
                      isValid: true,
                      message: '',
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!budgetCheck.isValid && formData.axe_id && formData.budget_cost && parseFloat(formData.budget_cost) > 0}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    !budgetCheck.isValid && formData.axe_id && formData.budget_cost && parseFloat(formData.budget_cost) > 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  {editingProject ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
              {!budgetCheck.isValid && formData.axe_id && formData.budget_cost && parseFloat(formData.budget_cost) > 0 && (
                <div className="mt-2 text-xs text-red-600 text-center">
                  ⚠️ Le budget est insuffisant. Veuillez réduire le montant ou choisir un autre axe.
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Projects;