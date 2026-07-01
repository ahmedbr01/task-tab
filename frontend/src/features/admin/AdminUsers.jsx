import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/user.api';
import { toast } from 'react-toastify';
import { Plus, Search, Pencil, Trash2, UserPlus, Users, X } from 'lucide-react';

// Fonction pour obtenir l'URL complète de l'avatar
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  return `http://localhost:5000${avatarPath}`;
};

// Fonction pour obtenir les initiales
const getInitials = (user) => {
  if (!user) return 'U';
  if (user.full_name) {
    const names = user.full_name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return user.full_name[0];
  }
  return user.username?.[0] || 'U';
};

// Composant Avatar
const Avatar = ({ user, size = 'w-8 h-8' }) => {
  if (!user) return null;
  
  const avatarUrl = getAvatarUrl(user.avatar);
  
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={user.full_name || user.username}
        className={`${size} rounded-full object-cover border-2 border-white shadow-sm`}
        onError={(e) => {
          e.target.style.display = 'none';
          const parent = e.target.parentElement;
          const initials = getInitials(user);
          parent.innerHTML = `<div class="${size} rounded-full bg-[#1a5b3e] flex items-center justify-center text-white font-bold text-sm">${initials}</div>`;
        }}
      />
    );
  }
  
  return (
    <div className={`${size} rounded-full bg-[#1a5b3e] flex items-center justify-center text-white font-bold text-sm`}>
      {getInitials(user)}
    </div>
  );
};

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'member',
    is_active: true,
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getAll();
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error('❌ Erreur chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { username, password, ...updateData } = formData;
        if (password) {
          updateData.password = password;
        }
        await userApi.update(editingUser.id, updateData);
        toast.success('✅ Utilisateur mis à jour');
      } else {
        await userApi.create(formData);
        toast.success('✅ Utilisateur créé');
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ username: '', password: '', full_name: '', email: '', phone: '', role: 'member', is_active: true });
      loadUsers();
    } catch (error) {
      toast.error('❌ Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'member',
      is_active: user.is_active !== undefined ? user.is_active : true,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      await userApi.delete(id);
      toast.success('✅ Utilisateur supprimé');
      loadUsers();
    } catch (error) {
      toast.error('❌ Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await userApi.update(user.id, { is_active: !user.is_active });
      toast.success(`✅ Utilisateur ${user.is_active ? 'désactivé' : 'activé'}`);
      loadUsers();
    } catch (error) {
      toast.error('❌ Erreur');
    }
  };

  const filteredUsers = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = (role) => {
    const labels = { admin: '👑 Admin', manager: '📋 Manager', member: '👤 Membre' };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = { admin: 'bg-red-100 text-red-800', manager: 'bg-blue-100 text-blue-800', member: 'bg-green-100 text-green-800' };
    return colors[role] || 'bg-gray-100 text-gray-800';
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
        title="👥 إدارة المستخدمين"
        subtitle={`${users.length} utilisateurs au total`}
      >
        {/* En-tête avec bouton d'ajout */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="relative max-w-xs flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
            <input
              type="text"
              placeholder="بحث عن مستخدم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 text-sm rounded-xl pr-9 pl-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1a5b3e]/30"
            />
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ username: '', password: '', full_name: '', email: '', phone: '', role: 'member', is_active: true });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-[#1a5b3e] hover:bg-[#0f3d28] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            مستخدم جديد
          </button>
        </div>

        {/* Tableau des utilisateurs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm text-slate-400">{filteredUsers.length} utilisateurs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs">
                  <th className="text-right font-semibold px-5 py-3">المستخدم</th>
                  <th className="text-right font-semibold px-5 py-3">البريد الإلكتروني</th>
                  <th className="text-right font-semibold px-5 py-3">الدور</th>
                  <th className="text-right font-semibold px-5 py-3">الحالة</th>
                  <th className="text-right font-semibold px-5 py-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar user={u} size="w-8 h-8" />
                        <div>
                          <span className="font-semibold text-slate-800">{u.full_name || u.username}</span>
                          <div className="text-xs text-slate-400">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500" dir="ltr">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${getRoleColor(u.role)}`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${u.is_active ? 'bg-[#22c55e1A] text-[#16a34a]' : 'bg-slate-100 text-slate-500'}`}>
                        {u.is_active ? '✅ نشط' : '❌ غير نشط'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleEdit(u)} 
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleActive(u)} 
                          className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-yellow-500 hover:bg-yellow-50' : 'text-green-500 hover:bg-green-50'}`}
                        >
                          {u.is_active ? '⏸️' : '▶️'}
                        </button>
                        {u.id !== currentUser?.id && (
                          <button 
                            onClick={() => handleDelete(u.id)} 
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageShell>

      {/* Modal d'ajout/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* En-tête du modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingUser ? '✏️ تعديل مستخدم' : '➕ مستخدم جديد'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
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
                    اسم المستخدم *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                    required
                    dir="rtl"
                    disabled={!!editingUser}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                    {editingUser ? 'كلمة المرور (اتركها فارغة للتغيير)' : 'كلمة المرور *'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                    required={!editingUser}
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                    required
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                    البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                    الدور
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                  >
                    <option value="member">👤 Membre</option>
                    <option value="manager">📋 Manager</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                </div>

                {editingUser && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-[#1a5b3e] rounded border-slate-300 focus:ring-[#1a5b3e]/30"
                    />
                    <label className="text-sm text-slate-700">مفعل</label>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a5b3e] hover:bg-[#0f3d28] text-white rounded-xl transition-colors text-sm font-medium shadow-sm"
                >
                  {editingUser ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUsers;