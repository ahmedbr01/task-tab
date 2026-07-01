import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { axeApi } from '../../api/axe.api';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, BookOpen, X } from 'lucide-react';

const Axes = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [axes, setAxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAxe, setEditingAxe] = useState(null);
  const [formData, setFormData] = useState({
    name_ar: '',
    description: '',
    code: '',
    color: '#6366f1',
    order: 0,
  });

  const loadAxes = async () => {
    try {
      const response = await axeApi.getAll();
      setAxes(response.data.axes || []);
    } catch (error) {
      toast.error('❌ Erreur lors du chargement des axes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAxes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAxe) {
        await axeApi.update(editingAxe.id, formData);
        toast.success('✅ Axe mis à jour');
      } else {
        await axeApi.create(formData);
        toast.success('✅ Axe créé');
      }
      setShowModal(false);
      setEditingAxe(null);
      setFormData({ name_ar: '', description: '', code: '', color: '#6366f1', order: 0 });
      loadAxes();
    } catch (error) {
      toast.error('❌ Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (axe) => {
    setEditingAxe(axe);
    setFormData({
      name_ar: axe.name_ar,
      description: axe.description || '',
      code: axe.code || '',
      color: axe.color || '#6366f1',
      order: axe.order || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet axe ?')) return;
    try {
      await axeApi.delete(id);
      toast.success('✅ Axe supprimé');
      loadAxes();
    } catch (error) {
      toast.error('❌ Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5b3e]"></div>
      </div>
    );
  }

  return (
    <>
      <PageShell
        title="📁 المحاور الاستراتيجية"
        subtitle={`${axes.length} axes stratégiques`}
      >
        {/* En-tête avec bouton d'ajout */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{axes.length} محاور</span>
          </div>
          {(isAdmin || isManager) && (
            <button
              onClick={() => {
                setEditingAxe(null);
                setFormData({ name_ar: '', description: '', code: '', color: '#6366f1', order: 0 });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-[#1a5b3e] hover:bg-[#0f3d28] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              محور جديد
            </button>
          )}
        </div>

        {/* Grille des axes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {axes.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <p className="text-3xl mb-4">📁</p>
              <p className="text-lg text-gray-500">لا توجد محاور استراتيجية</p>
            </div>
          ) : (
            axes.map((axe) => (
              <div
                key={axe.id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow group"
                style={{ borderRight: `4px solid ${axe.color || '#6366f1'}` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {axe.code && (
                        <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                          {axe.code}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-slate-800 truncate">{axe.name_ar}</h3>
                    </div>
                    {axe.description && (
                      <p className="text-slate-500 text-sm mt-1 line-clamp-2">{axe.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {axe.projects?.length || 0} projets
                      </span>
                      <span className="flex items-center gap-1">
                        <span 
                          className="w-3 h-3 rounded-full border border-slate-200" 
                          style={{ backgroundColor: axe.color || '#6366f1' }}
                        ></span>
                      </span>
                    </div>
                  </div>
                  {(isAdmin || isManager) && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(axe)} 
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(axe.id)} 
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PageShell>

      {/* Modal d'ajout/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* En-tête du modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingAxe ? '✏️ تعديل المحور' : '➕ محور جديد'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingAxe(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                    اسم المحور *
                  </label>
                  <input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                    required
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                    الوصف
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all resize-none"
                    rows="3"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                    الرمز
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                    dir="rtl"
                    placeholder="ex: AX-01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                    اللون
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                    ترتيب العرض
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                    min="0"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAxe(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a5b3e] hover:bg-[#0f3d28] text-white rounded-xl transition-colors text-sm font-medium shadow-sm"
                >
                  {editingAxe ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Axes;