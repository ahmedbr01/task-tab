import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';

const AdminCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name_ar: '',
    color: '#22c55e',
    icon: '📋',
    display_order: 0,
    is_active: true,
  });

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories/admin', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      toast.error('❌ Erreur chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingCategory 
        ? `http://localhost:5000/api/categories/${editingCategory.id}`
        : 'http://localhost:5000/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(editingCategory ? '✅ Catégorie mise à jour' : '✅ Catégorie créée');
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name_ar: '', color: '#22c55e', icon: '📋', display_order: 0, is_active: true });
        loadCategories();
      } else {
        toast.error('❌ Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      toast.error('❌ Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name_ar: cat.name_ar,
      color: cat.color || '#22c55e',
      icon: cat.icon || '📋',
      display_order: cat.display_order || 0,
      is_active: cat.is_active !== undefined ? cat.is_active : true,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast.success('✅ Catégorie supprimée');
        loadCategories();
      } else {
        toast.error('❌ Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('❌ Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...cat, is_active: !cat.is_active }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`✅ Catégorie ${cat.is_active ? 'désactivée' : 'activée'}`);
        loadCategories();
      }
    } catch (error) {
      toast.error('❌ Erreur');
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
    <PageShell
      active="التصنيفات"
      title="🏷️ إدارة التصنيفات"
      subtitle={`${categories.length} catégories`}
      right={
        <button
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name_ar: '', color: '#22c55e', icon: '📋', display_order: 0, is_active: true });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-[#1a5b3e] hover:bg-[#0f3d28] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> تصنيف جديد
        </button>
      }
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التصنيف</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اللون</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأيقونة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الترتيب</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  <p className="text-lg">🏷️ Aucune catégorie</p>
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{cat.name_ar}</td>
                  <td className="px-6 py-4">
                    <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: cat.color }}></div>
                  </td>
                  <td className="px-6 py-4 text-2xl">{cat.icon}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{cat.display_order}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${cat.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {cat.is_active ? '✅ Actif' : '❌ Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:text-blue-800 p-1">✏️</button>
                      <button onClick={() => handleToggleActive(cat)} className={`p-1 ${cat.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}>
                        {cat.is_active ? '⏸️' : '▶️'}
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-800 p-1">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingCategory ? '✏️ تعديل تصنيف' : '➕ تصنيف جديد'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm mb-1 text-right">اسم التصنيف *</label>
                  <input type="text" value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required dir="rtl" />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-1 text-right">اللون</label>
                  <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full h-12 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-1 text-right">الأيقونة</label>
                  <input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="📋" />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-1 text-right">ترتيب العرض</label>
                  <input type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                {editingCategory && (
                  <div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 text-primary-600" />
                      <span className="text-gray-700 text-sm">مفعل</span>
                    </label>
                  </div>
                )}
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowModal(false); setEditingCategory(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingCategory ? 'تحديث' : 'إنشاء'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default AdminCategories;