import { useState, useEffect, useRef } from 'react';
import { PageShell } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';
import { toast } from 'react-toastify';
import { Camera, Lock, Phone, Mail, Shield, Check } from 'lucide-react';

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

// Composant Avatar avec upload
const ProfileAvatar = ({ user, onUpload }) => {
  const fileInputRef = useRef(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  
  const avatarUrl = getAvatarUrl(user?.avatar);
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('❌ La photo ne doit pas dépasser 5MB');
      return;
    }
    if (onUpload) {
      setAvatarLoading(true);
      await onUpload(file);
      setAvatarLoading(false);
    }
    e.target.value = '';
  };

  return (
    <div className="relative">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user?.full_name || user?.username}
          className="w-28 h-28 rounded-full object-cover ring-4 ring-[#1a5b3e]/10"
          onError={(e) => {
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            const initials = getInitials(user);
            parent.innerHTML = `<div class="w-28 h-28 rounded-full bg-[#1a5b3e] flex items-center justify-center text-white font-bold text-3xl ring-4 ring-[#1a5b3e]/10">${initials}</div>`;
          }}
        />
      ) : (
        <div className="w-28 h-28 rounded-full bg-[#1a5b3e] flex items-center justify-center text-white font-bold text-3xl ring-4 ring-[#1a5b3e]/10">
          {getInitials(user)}
        </div>
      )}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={avatarLoading}
        className="absolute bottom-0 left-0 bg-white border border-slate-200 rounded-full p-2 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
        title="Changer la photo"
      >
        {avatarLoading ? '⏳' : <Camera className="w-4 h-4 text-slate-600" />}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('infos');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.updateProfile(formData);
      toast.success('✅ Profil mis à jour avec succès');
      window.location.reload();
    } catch (error) {
      toast.error(`❌ ${error.response?.data?.message || 'Erreur'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('❌ Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('❌ Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('✅ Mot de passe changé avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(`❌ ${error.response?.data?.message || 'Erreur'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      await authApi.uploadAvatar(formData);
      toast.success('✅ Photo de profil mise à jour');
      window.location.reload();
    } catch (error) {
      toast.error('❌ Erreur lors du téléchargement');
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5b3e]"></div>
      </div>
    );
  }

  return (
    <PageShell active="" title="ملفي الشخصي" subtitle="إدارة معلوماتكم الشخصية وإعدادات الحساب">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte photo */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center h-fit">
          <ProfileAvatar user={user} onUpload={handleAvatarUpload} />
          
          <h2 className="font-bold text-slate-900 mt-4">{user.full_name || user.username}</h2>
          <p className="text-sm text-slate-400">
            {user.role === 'admin' ? 'مدير النظام' : user.role === 'manager' ? 'مدير' : 'عضو'}
          </p>
          <span className="mt-3 text-[11px] font-semibold text-[#1a5b3e] bg-[#1a5b3e]/10 px-3 py-1 rounded-full">
            صلاحية: {user.role === 'admin' ? 'الإدارة' : user.role === 'manager' ? 'التوجيه' : 'التنفيذ'}
          </span>
          <div className="w-full border-t border-slate-100 mt-6 pt-5 text-right space-y-3">
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span dir="ltr" className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span dir="ltr">{user.phone || '+216 00 000 000'}</span>
            </div>
          </div>
        </div>

        {/* Formulaires */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex border-b border-slate-100">
              <button onClick={() => setTab('infos')} className={`flex-1 px-4 py-3.5 text-sm font-semibold transition-colors ${tab === 'infos' ? 'text-[#1a5b3e] border-b-2 border-[#1a5b3e]' : 'text-slate-400'}`}>
                المعلومات الشخصية
              </button>
              <button onClick={() => setTab('securite')} className={`flex-1 px-4 py-3.5 text-sm font-semibold transition-colors ${tab === 'securite' ? 'text-[#1a5b3e] border-b-2 border-[#1a5b3e]' : 'text-slate-400'}`}>
                الأمان وكلمة المرور
              </button>
            </div>

            {tab === 'infos' ? (
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">الاسم الكامل</label>
                    <input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#22c55e]/40" /></div>
                  <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">البريد الإلكتروني</label>
                    <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#22c55e]/40" /></div>
                  <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">رقم الهاتف</label>
                    <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#22c55e]/40" /></div>
                </div>
                <button type="submit" disabled={loading} className="bg-[#1a5b3e] hover:bg-[#0f3d28] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                  {loading ? '⏳' : 'حفظ التغييرات'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleChangePassword} className="p-6 space-y-5">
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">كلمة المرور الحالية</label>
                  <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#22c55e]/40" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">كلمة المرور الجديدة</label>
                    <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#22c55e]/40" /></div>
                  <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">تأكيد كلمة المرور</label>
                    <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#22c55e]/40" /></div>
                </div>
                <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#1a5b3e] hover:bg-[#0f3d28] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                  <Check className="w-4 h-4" /> تحديث كلمة المرور
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Profile;