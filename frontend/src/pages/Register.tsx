import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { registerUser, clearError } from '../features/auth/authSlice';
import { Mail, KeyRound, User, AlertTriangle, Briefcase, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(3, { message: 'الاسم يجب أن يكون 3 أحرف على الأقل' }),
  email: z.string().email({ message: 'البريد الإلكتروني غير صالح' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
  role: z.enum(['STUDENT', 'ADMIN']),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url({ message: 'رابط الصورة غير صالح' }).optional().or(z.literal('')),
});

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT' as 'STUDENT' | 'ADMIN',
    specialization: '',
    bio: '',
    avatarUrl: ''
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear validation error when user types
    if (validationErrors[e.target.name]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    try {
      // Validate using Zod
      const validatedData = registerSchema.parse(formData);
      
      // Dispatch Redux Action
      const resultAction = await dispatch(registerUser(validatedData));
      
      if (registerUser.fulfilled.match(resultAction)) {
        toast.success('تم إنشاء الحساب بنجاح! مرحباً بك 🚀');
      } else {
        toast.error(resultAction.payload as string || 'حدث خطأ أثناء التسجيل');
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const errors: { [key: string]: string } = {};
        (err as any).errors.forEach((e: any) => {
          if (e.path[0]) {
            errors[e.path[0].toString()] = e.message;
          }
        });
        setValidationErrors(errors);
        toast.error('يرجى مراجعة الحقول وإصلاح الأخطاء');
      }
    }
  };

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-24 pb-12 rtl">
      <div className="absolute w-[300px] h-[300px] bg-theme-accent/25 rounded-full blur-[80px] -z-10 pointer-events-none" />

      <div className="w-full max-w-lg glass-panel p-8 rounded-2xl border border-white/10 shadow-glass space-y-6 my-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">إنشاء حساب جديد ✨</h2>
          <p className="text-slate-400 text-xs mt-1.5">ابدأ رحلتك الإبداعية معنا اليوم</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Role selection */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold">نوع الحساب</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all cursor-pointer"
            >
              <option value="STUDENT">طالب (Student)</option>
              <option value="ADMIN">مدرس / مدير لوحة التحكم (Admin)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name input */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-400 text-xs font-semibold">الاسم الكامل</label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="مثال: أحمد محمد"
                  className={`w-full bg-slate-950 border ${validationErrors.name ? 'border-rose-500' : 'border-white/10'} rounded-xl pr-11 pl-4 py-3 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all`}
                />
              </div>
              {validationErrors.name && <p className="text-rose-500 text-xs mt-1">{validationErrors.name}</p>}
            </div>

            {/* Email input */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-400 text-xs font-semibold">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full bg-slate-950 border ${validationErrors.email ? 'border-rose-500' : 'border-white/10'} rounded-xl pr-11 pl-4 py-3 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all text-left ltr`}
                />
              </div>
              {validationErrors.email && <p className="text-rose-500 text-xs mt-1">{validationErrors.email}</p>}
            </div>

            {/* Password input */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-400 text-xs font-semibold">كلمة المرور</label>
              <div className="relative">
                <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full bg-slate-950 border ${validationErrors.password ? 'border-rose-500' : 'border-white/10'} rounded-xl pr-11 pl-4 py-3 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all text-left ltr`}
                />
              </div>
              {validationErrors.password && <p className="text-rose-500 text-xs mt-1">{validationErrors.password}</p>}
            </div>
          </div>

          {/* Instructor Extra Fields */}
          {formData.role === 'ADMIN' && (
            <div className="space-y-4 pt-4 border-t border-white/10 mt-4 animate-fade-in">
              <h3 className="text-theme-neonCyan font-semibold text-sm mb-2">معلومات المدرس (اختياري)</h3>
              
              {/* Specialization */}
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold">التخصص</label>
                <div className="relative">
                  <Briefcase className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="مثال: مدرس فيزياء"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pr-11 pl-4 py-3 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold">نبذة تعريفية (Bio)</label>
                <div className="relative">
                  <FileText className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="اكتب نبذة عن خبراتك..."
                    rows={3}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pr-11 pl-4 py-3 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all resize-none"
                  />
                </div>
              </div>

              {/* Avatar URL */}
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold">رابط الصورة الشخصية</label>
                <div className="relative">
                  <ImageIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                    className={`w-full bg-slate-950 border ${validationErrors.avatarUrl ? 'border-rose-500' : 'border-white/10'} rounded-xl pr-11 pl-4 py-3 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all text-left ltr`}
                  />
                </div>
                {validationErrors.avatarUrl && <p className="text-rose-500 text-xs mt-1">{validationErrors.avatarUrl}</p>}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-theme-accent via-theme-neonPurple to-theme-neonCyan text-white font-bold hover:shadow-glow-purple transition-all duration-300 transform hover:scale-[1.01] cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'تأكيد التسجيل'
            )}
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
