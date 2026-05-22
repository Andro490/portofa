import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { logoutUser } from '../features/auth/authSlice';
import { BookOpen, User, LogOut, LayoutDashboard, Shield } from 'lucide-react';

const Navbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/');
  };

  return (
    <nav className="fixed top-4 left-4 right-4 z-50 glass-panel rounded-2xl px-6 py-4 shadow-glass max-w-7xl mx-auto flex items-center justify-between rtl">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-theme-accent to-theme-neonCyan flex items-center justify-center text-white shadow-glow-cyan transition-transform group-hover:rotate-12 duration-300">
          <BookOpen className="w-5 h-5" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-slate-300 group-hover:to-theme-neonCyan transition-all duration-300">
          أكاديمية <span className="text-theme-neonCyan">سينما</span>
        </span>
      </Link>

      {/* Main Navigation Links */}
      <div className="hidden md:flex items-center gap-8">
        <Link to="/" className="text-slate-300 hover:text-theme-neonCyan transition-colors font-medium">
          الرئيسية
        </Link>
        <Link to="/courses" className="text-slate-300 hover:text-theme-neonCyan transition-colors font-medium">
          الدورات التعليمية
        </Link>
        {isAuthenticated && (
          <Link to="/dashboard" className="text-slate-300 hover:text-theme-neonCyan transition-colors font-medium flex items-center gap-1">
            <LayoutDashboard className="w-4 h-4" />
            لوحة الطالب
          </Link>
        )}
        {isAuthenticated && user?.role === 'ADMIN' && (
          <Link to="/admin" className="text-theme-neonPurple hover:text-white transition-colors font-semibold flex items-center gap-1 border border-theme-neonPurple/30 bg-theme-neonPurple/5 px-3 py-1 rounded-full text-sm">
            <Shield className="w-3.5 h-3.5" />
            لوحة الإدارة
          </Link>
        )}
      </div>

      {/* Auth Actions */}
      <div className="flex items-center gap-4">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-left items-end">
              <span className="text-xs text-theme-neonCyan font-semibold">
                {user.role === 'ADMIN' ? 'مدير النظام' : 'طالب'}
              </span>
              <span className="text-sm font-semibold text-slate-200">
                {user.name}
              </span>
            </div>
            
            <div className="w-9 h-9 rounded-full bg-theme-accent/20 border border-theme-accent/50 flex items-center justify-center text-theme-neonCyan">
              <User className="w-4 h-4" />
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-400 transition-all duration-300 cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors font-medium text-sm"
            >
              تسجيل الدخول
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-linear-to-r from-theme-accent to-theme-neonPurple text-white text-sm font-semibold hover:shadow-glow-purple transition-all duration-300 transform hover:scale-[1.02]"
            >
              انضم إلينا مجاناً
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
