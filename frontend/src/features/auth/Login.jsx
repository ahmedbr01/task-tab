import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Eye, EyeOff, User, Lock, ShieldCheck, LogIn } from 'lucide-react';
import logo from '../../assets/logo.png'; 

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(formData);
    if (result.success) {
      toast.success('✅ تم تسجيل الدخول بنجاح');
      navigate('/dashboard');
    } else {
      toast.error(`❌ ${result.error || 'فشل تسجيل الدخول'}`);
    }
    setLoading(false);
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        fontFamily: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif",
        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)',
      }}
    >
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* ============ SIDEBAR GAUCHE (VERT) ============ */}
        <div className="w-full md:w-2/5 bg-[#2d5a27] flex flex-col items-center justify-center p-8 md:p-10 gap-4">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-lg">
            <img 
              src={logo} 
              alt="CNRPS Logo" 
              className="w-20 h-20 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.textContent = 'CNRPS';
                e.target.parentElement.style.fontSize = '20px';
                e.target.parentElement.style.fontWeight = 'bold';
                e.target.parentElement.style.color = '#2d5a27';
              }}
            />
          </div>
          
          <h1 className="text-white text-2xl font-bold tracking-wider">TASK TAB</h1>
          
          <div className="w-12 h-0.5 bg-white/30 rounded-full"></div>
          
          <p className="text-[#a8d5a2] text-sm text-center leading-relaxed">
            منصة المتابعة والقيادة<br />
            للمشاريع والأنشطة
          </p>
          
          <p className="text-white/60 text-xs text-center mt-2">
            مكتب الاتصال والتعاون الدولي<br />
            الصندوق الوطني للتقاعد والحيطة الاجتماعية
          </p>
        </div>

        {/* ============ FORMULAIRE DROITE ============ */}
        <div className="w-full md:w-3/5 p-8 md:p-10 flex flex-col justify-center">
          <h2 className="text-xl font-semibold text-slate-800">تسجيل الدخول</h2>
          <p className="text-sm text-slate-500 mb-6">أدخل بيانات الاعتماد الخاصة بك للمتابعة</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Champ Nom d'utilisateur */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">اسم المستخدم</label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus-within:ring-2 focus-within:ring-[#2d5a27]/40 focus-within:border-[#2d5a27] transition-all">
                <User className="w-5 h-5 text-[#2d5a27] flex-shrink-0" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="أدخل اسم المستخدم"
                  className="w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">كلمة المرور</label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus-within:ring-2 focus-within:ring-[#2d5a27]/40 focus-within:border-[#2d5a27] transition-all">
                <Lock className="w-5 h-5 text-[#2d5a27] flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="أدخل كلمة المرور"
                  className="w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                  className="w-4 h-4 rounded border-slate-300 text-[#2d5a27] focus:ring-[#2d5a27]"
                />
                تذكرني
              </label>
              <button type="button" className="text-sm text-[#2d5a27] hover:underline">
                هل نسيت كلمة المرور؟
              </button>
            </div>

            {/* Bouton Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2d5a27] hover:bg-[#3a7030] text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#2d5a27]/25 disabled:opacity-50"
            >
              {loading ? (
                '⏳ جاري تسجيل الدخول...'
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  دخول
                </>
              )}
            </button>
          </form>

          {/* Pied de formulaire */}
          <p className="text-center text-xs text-slate-400 mt-4">
            هذه المنصة مخصصة لموظفي مكتب الاتصال والتعاون الدولي — BCCI
          </p>

          <div className="flex items-center gap-2 justify-center mt-3 bg-[#f0f7ee] border border-[#a8d5a2] rounded-xl py-2 px-4">
            <ShieldCheck className="w-4 h-4 text-[#2d5a27]" />
            <span className="text-xs text-[#2d5a27]">اتصال آمن — الشبكة الداخلية للصندوق</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;