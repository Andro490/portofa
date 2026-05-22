import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { registerUser, clearError } from '../features/auth/authSlice';
import { Mail, KeyRound, User, AlertTriangle } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'ADMIN'>('STUDENT');

  // Clear errors on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Redirect on successful auth
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    dispatch(registerUser({ name, email, password, role }));
  };

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-24 pb-12 rtl">
      <div className="absolute w-[300px] h-[300px] bg-theme-accent/25 rounded-full blur-[80px] -z-10 pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/10 shadow-glass space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">إنشاء حساب جديد ✨</h2>
          <p className="text-slate-400 text-xs mt-1.5">ابدأ رحلتك الإبداعية معنا اليوم مجاناً</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Name input */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold">الاسم الكامل</label>
            <div className="relative">
              <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                className="w-full bg-slate-950 border border-white/10 rounded-xl pr-11 pl-4 py-3 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all"
              />
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-white/10 rounded-xl pr-11 pl-4 py-3 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all text-left ltr"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold">كلمة المرور</label>
            <div className="relative">
              <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-white/10 rounded-xl pr-11 pl-4 py-3 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all text-left ltr"
              />
            </div>
          </div>

          {/* Optional Role selection (useful for sandbox testing) */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold">نوع الحساب (Sandbox)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all cursor-pointer"
            >
              <option value="STUDENT">طالب (Student)</option>
              <option value="ADMIN">مدير لوحة التحكم (Admin)</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-theme-accent via-theme-neonPurple to-theme-neonCyan text-white font-bold hover:shadow-glow-purple transition-all duration-300 transform hover:scale-[1.01] cursor-pointer disabled:opacity-50"
          >
            {loading ? 'جاري إنشاء الحساب...' : 'تأكيد التسجيل'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 border-t border-white/5 pt-4">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-theme-neonCyan hover:underline font-semibold">
            سجل دخولك
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
