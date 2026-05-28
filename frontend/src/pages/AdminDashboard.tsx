import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { fetchCategories, createCategory } from '../features/courses/coursesSlice';
import api from '../services/api';
import * as xlsx from 'xlsx';
import { Shield, BookOpen, Users, DollarSign, Layers, PlusCircle, Trash2, Tag, PlayCircle, Clock, FolderPlus, CheckCircle, XCircle } from 'lucide-react';

interface StatsSummary {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
}

interface CourseItem {
  id: string;
  title: string;
  price: number;
  categoryId: string;
  lessons: { id: string }[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { categories } = useAppSelector((state) => state.courses);

  const [activeTab, setActiveTab] = useState<'stats' | 'courses' | 'lessons'>('stats');
  
  // Stats states
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states for new course
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [coursePrice, setCoursePrice] = useState('0');
  const [courseCat, setCourseCat] = useState('');
  const [courseThumb, setCourseThumb] = useState('');

  // Category creation state
  const [newCatName, setNewCatName] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [catMessage, setCatMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [lessonCourseId, setLessonCourseId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideo, setLessonVideo] = useState('');
  const [lessonPlatformType, setLessonPlatformType] = useState('youtube');
  const [lessonLibraryId, setLessonLibraryId] = useState('');
  const [lessonTokenKey, setLessonTokenKey] = useState('');
  const [lessonDuration, setLessonDuration] = useState('600');
  const [lessonOrder, setLessonOrder] = useState('1');

  // Quiz states
  const [quizFile, setQuizFile] = useState<File | null>(null);
  const [quizPreview, setQuizPreview] = useState<any[]>([]);

  // Homework states
  const [homeworkFile, setHomeworkFile] = useState<File | null>(null);
  const [homeworkPreview, setHomeworkPreview] = useState<any[]>([]);

  // Course accordion state
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    dispatch(fetchCategories());
    fetchAdminData();
  }, [isAuthenticated, user, navigate, dispatch]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/dashboard/admin');
      setSummary(statsRes.data.summary);
      setRecentUsers(statsRes.data.recentUsers || []);
      setRecentPayments(statsRes.data.recentPayments || []);

      const coursesRes = await api.get('/courses');
      setCoursesList(coursesRes.data || []);
      if (coursesRes.data.length > 0) {
        setLessonCourseId(coursesRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllStudents = async () => {
    const confirmDelete = window.confirm("هل أنت متأكد من أنك تريد حذف جميع الطلاب من النظام؟ (هذا الإجراء لا يمكن التراجع عنه وسيحذف كل بيانات الطلاب واشتراكاتهم)");
    if (!confirmDelete) return;

    try {
      await api.delete('/dashboard/admin/students');
      alert('تم حذف جميع حسابات الطلاب بنجاح. عام دراسي جديد سعيد!');
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل حذف الطلاب');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (user?.id === userId) {
      alert("لا يمكنك حذف حسابك الشخصي لتجنب فقدان صلاحيات الإدارة.");
      return;
    }
    const confirmDelete = window.confirm(`هل أنت متأكد من حذف المستخدم "${userName}" نهائياً؟`);
    if (!confirmDelete) return;

    try {
      await api.delete(`/dashboard/admin/users/${userId}`);
      alert('تم حذف المستخدم بنجاح.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل حذف المستخدم');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatLoading(true);
    setCatMessage(null);
    try {
      await dispatch(createCategory(newCatName.trim())).unwrap();
      setCatMessage({ type: 'success', text: `تم إضافة “${newCatName.trim()}” بنجاح!` });
      setNewCatName('');
    } catch (err: any) {
      setCatMessage({ type: 'error', text: err || 'فشل إنشاء التصنيف' });
    } finally {
      setCatLoading(false);
      setTimeout(() => setCatMessage(null), 3500);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle || !courseDesc || !courseCat) {
      alert('الرجاء تعبئة الحقول الأساسية للدورة');
      return;
    }

    try {
      await api.post('/courses', {
        title: courseTitle,
        description: courseDesc,
        price: parseFloat(coursePrice),
        categoryId: courseCat,
        thumbnail: courseThumb || undefined,
      });

      alert('تم إنشاء الدورة بنجاح!');
      // Reset Form
      setCourseTitle('');
      setCourseDesc('');
      setCoursePrice('0');
      setCourseThumb('');
      
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل إنشاء الدورة');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الدورة بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      await api.delete(`/courses/${courseId}`);
      alert('تم حذف الدورة بنجاح.');
      if (expandedCourseId === courseId) setExpandedCourseId(null);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل حذف الدورة');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الدرس نهائياً؟')) return;
    try {
      await api.delete(`/courses/lessons/${lessonId}`);
      alert('تم حذف الدرس بنجاح.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل حذف الدرس');
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonCourseId || !lessonTitle) {
      alert('الرجاء اختيار الدورة وكتابة عنوان الدرس');
      return;
    }

    try {
      const res = await api.post('/courses/lessons', {
        courseId: lessonCourseId,
        title: lessonTitle,
        content: lessonContent || undefined,
        videoUrl: lessonPlatformType === 'quiz' ? undefined : (lessonVideo || undefined),
        platformType: lessonPlatformType,
        libraryId: lessonPlatformType === 'secure' && lessonLibraryId ? lessonLibraryId : undefined,
        tokenKey: lessonPlatformType === 'secure' && lessonTokenKey ? lessonTokenKey : undefined,
        duration: parseInt(lessonDuration),
        order: parseInt(lessonOrder),
      });

      // If it's a quiz, upload the file
      if (lessonPlatformType === 'quiz' && quizFile) {
        const lessonId = res.data?.id;
        console.log('=== Quiz Upload Debug ===');
        console.log('Full res.data:', res.data);
        console.log('lessonId to send:', lessonId);
        if (!lessonId) {
          alert('خطأ: لم يتم استلام ID الدرس من السيرفر.\nالبيانات: ' + JSON.stringify(res.data));
          return;
        }
        const formData = new FormData();
        formData.append('file', quizFile);
        formData.append('lessonId', lessonId);
        formData.append('title', lessonTitle);
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://backend-production-a4c41.up.railway.app/api';
        const uploadRes = await fetch(`${apiBaseUrl}/courses/quiz/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({ message: 'Upload failed' }));
          throw new Error(errData.message || `Upload error: ${uploadRes.status}`);
        }
      }

      // If it's a homework, upload the file
      if (lessonPlatformType === 'homework' && homeworkFile) {
        const lessonId = res.data?.id;
        if (!lessonId) {
          alert('خطأ: لم يتم استلام ID الدرس.');
          return;
        }
        const formData = new FormData();
        formData.append('file', homeworkFile);
        formData.append('lessonId', lessonId);
        formData.append('title', lessonTitle);
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://backend-production-a4c41.up.railway.app/api';
        const uploadRes = await fetch(`${apiBaseUrl}/courses/homework/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({ message: 'Upload failed' }));
          throw new Error(errData.message || `Upload error: ${uploadRes.status}`);
        }
      }

      alert('تمت إضافة الدرس بنجاح!');
      // Reset Form
      setLessonTitle('');
      setLessonContent('');
      setLessonVideo('');
      setLessonLibraryId('');
      setLessonTokenKey('');
      setLessonDuration('600');
      setLessonOrder((parseInt(lessonOrder) + 1).toString());
      setQuizFile(null);
      setQuizPreview([]);
      setHomeworkFile(null);
      setHomeworkPreview([]);

      fetchAdminData();
    } catch (err: any) {
      console.error('Full Upload Error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'فشلت إضافة الدرس';
      const received = err.response?.data?.received 
        ? '\nما استلمه السيرفر: ' + JSON.stringify(err.response.data.received)
        : '';
      alert(`تفاصيل الخطأ:\n${errorMsg}${received}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setQuizFile(null);
      setQuizPreview([]);
      return;
    }
    setQuizFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws);
        setQuizPreview(data.slice(0, 5));
      } catch (err) {
        console.error('Error parsing excel:', err);
        alert('خطأ في قراءة ملف الإكسيل.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleHomeworkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setHomeworkFile(null); setHomeworkPreview([]); return; }
    setHomeworkFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(ws);
        setHomeworkPreview(data.slice(0, 5));
      } catch { alert('خطأ في قراءة ملف الإكسيل.'); }
    };
    reader.readAsBinaryString(file);
  };

  if (loading || !categories) {
    return (
      <div className="min-h-screen flex items-center justify-center rtl">
        <div className="w-12 h-12 border-4 border-theme-neonCyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Pre-fill categories select box on mount
  if (categories.length > 0 && !courseCat) {
    setCourseCat(categories[0].id);
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 rtl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-6 mb-10">
        <div className="w-11 h-11 rounded-xl bg-theme-neonPurple/10 border border-theme-neonPurple/30 flex items-center justify-center text-theme-neonPurple shadow-glow-purple">
          <Shield className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">لوحة الإدارة والمحتوى 🛠️</h1>
          <span className="text-xs text-theme-neonCyan font-semibold">بوابة المشرفين - تحكم شامل بالمنصة</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-white/5 gap-6 mb-10 text-sm">
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-4 font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'stats' ? 'border-theme-neonCyan text-theme-neonCyan' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          لوحة الإحصائيات
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-4 font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'courses' ? 'border-theme-neonCyan text-theme-neonCyan' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          إدارة الدورات
        </button>
        <button
          onClick={() => setActiveTab('lessons')}
          className={`pb-4 font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'lessons' ? 'border-theme-neonCyan text-theme-neonCyan' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          إضافة الدروس
        </button>
      </div>

      {/* ✅ Category Creator Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-theme-neonCyan/10 mb-8">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <FolderPlus className="w-4 h-4 text-theme-neonCyan" />
          إدارة التصنيفات
        </h3>
        <form onSubmit={handleAddCategory} className="flex items-center gap-3">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="مثال: تطوير الويب، الذكاء الاصطناعي, Adobe..."
            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-theme-neonCyan transition-all"
          />
          <button
            type="submit"
            disabled={catLoading || !newCatName.trim()}
            className="px-5 py-2.5 rounded-xl bg-theme-neonCyan/15 border border-theme-neonCyan/30 hover:bg-theme-neonCyan hover:text-white text-theme-neonCyan font-bold text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {catLoading ? 'جاري...' : '+ إضافة تصنيف'}
          </button>
        </form>

        {catMessage && (
          <div className={`mt-2 flex items-center gap-2 text-xs font-semibold ${
            catMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {catMessage.type === 'success'
              ? <CheckCircle className="w-3.5 h-3.5" />
              : <XCircle className="w-3.5 h-3.5" />}
            {catMessage.text}
          </div>
        )}

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
            {categories.map((cat) => (
              <span key={cat.id} className="px-3 py-1 rounded-full text-xs font-semibold bg-theme-card border border-white/10 text-slate-300">
                {cat.name}
                {cat._count && <span className="mr-1.5 text-theme-neonCyan opacity-60">({cat._count.courses})</span>}
              </span>
            ))}
          </div>
        )}
      </div>
      {activeTab === 'stats' && (
        <div className="space-y-12">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-xs font-semibold">المستخدمين</span>
                <Users className="w-5 h-5 text-theme-neonCyan" />
              </div>
              <span className="text-3xl font-extrabold text-white block">{summary?.totalUsers}</span>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-xs font-semibold">الدورات الفعالة</span>
                <BookOpen className="w-5 h-5 text-theme-accent" />
              </div>
              <span className="text-3xl font-extrabold text-white block">{summary?.totalCourses}</span>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-xs font-semibold">الاشتراكات</span>
                <Layers className="w-5 h-5 text-theme-neonPurple" />
              </div>
              <span className="text-3xl font-extrabold text-white block">{summary?.totalEnrollments}</span>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-xs font-semibold">الأرباح الإجمالية</span>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-3xl font-extrabold text-emerald-400 block">{summary?.totalRevenue.toFixed(2)} $</span>
            </div>
          </div>

          {/* Grids for listings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Registrations */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-white">أحدث المستخدمين المسجلين</h3>
                <button
                  onClick={handleDeleteAllStudents}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف جميع الطلاب
                </button>
              </div>
              <div className="space-y-4">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0 text-xs sm:text-sm">
                    <div>
                      <span className="text-white font-semibold block">{u.name}</span>
                      <span className="text-slate-500 text-[10px]">عنوان محمي 🔒</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-theme-neonPurple/20 text-theme-neonPurple' : 'bg-theme-neonCyan/20 text-theme-neonCyan'
                      }`}>
                        {u.role}
                      </span>
                      {user?.id !== u.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="حذف المستخدم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payments */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-base font-bold text-white mb-2">العمليات والمدفوعات الأخيرة</h3>
              <div className="space-y-4">
                {recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0 text-xs sm:text-sm">
                    <div>
                      <span className="text-white font-semibold block">{p.user?.name}</span>
                      <span className="text-slate-400 text-xs line-clamp-1">{p.course?.title}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-emerald-400 font-bold block">{p.amount} $</span>
                      <span className="text-slate-500 text-[10px]">{p.transactionId}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Create course Form */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <PlusCircle className="w-5 h-5 text-theme-neonCyan" />
              إضافة دورة جديدة
            </h3>

            <form onSubmit={handleCreateCourse} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold">عنوان الدورة</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="مثال: أساسيات Three.js"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold">تصنيف الدورة</label>
                <select
                  value={courseCat}
                  onChange={(e) => setCourseCat(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold">سعر الدورة ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={coursePrice}
                  onChange={(e) => setCoursePrice(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold">رابط صورة مصغرة (Thumbnail)</label>
                <input
                  type="text"
                  value={courseThumb}
                  onChange={(e) => setCourseThumb(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold">الوصف التفصيلي</label>
                <textarea
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  rows={4}
                  placeholder="اكتب تفاصيل الدورة..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-theme-neonCyan/15 border border-theme-neonCyan/30 hover:bg-theme-neonCyan hover:text-white text-theme-neonCyan font-bold transition-all duration-300 shadow-glow-cyan cursor-pointer"
              >
                تأكيد إنشاء الدورة
              </button>
            </form>
          </div>

          {/* Courses List */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-white mb-4">الدورات الحالية المدرجة بالمنصة</h3>
            
            <div className="space-y-3">
              {coursesList.map((course) => (
                <div key={course.id} className="rounded-xl bg-theme-card/30 border border-white/5 overflow-hidden">
                  <div 
                    className="p-4 flex items-center justify-between text-xs sm:text-sm cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedCourseId(expandedCourseId === course.id ? null : course.id)}
                  >
                    <div>
                      <h4 className="text-white font-bold text-sm">{course.title}</h4>
                      <div className="flex gap-4 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {course.lessons?.length || 0} دروس
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Tag className="w-3.5 h-3.5" />
                          {categories.find(c => c.id === course.categoryId)?.name || 'عام'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-theme-neonCyan font-bold">{course.price} $</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course.id);
                        }}
                        className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors cursor-pointer"
                        title="حذف الدورة بالكامل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* الدروس التابعة لهذه الدورة */}
                  {expandedCourseId === course.id && (
                    <div className="bg-slate-900/50 p-4 border-t border-white/5 space-y-2">
                      <h5 className="text-xs font-bold text-slate-300 mb-3 border-b border-white/5 pb-2">دروس الدورة:</h5>
                      {course.lessons && course.lessons.length > 0 ? (
                        course.lessons.map((lesson: any, idx: number) => (
                          <div key={lesson.id} className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-slate-900">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                              <span className="text-sm font-semibold text-slate-200">{lesson.title}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${lesson.platformType === 'secure' ? 'bg-theme-neonPurple/20 text-theme-neonPurple' : 'bg-rose-500/20 text-rose-400'}`}>
                                {lesson.platformType === 'secure' ? 'فيديو محمي' : 'يوتيوب'}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLesson(lesson.id);
                              }}
                              className="text-rose-400 hover:text-rose-500 transition-colors p-1"
                              title="حذف الدرس"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-2">لا توجد دروس في هذه الدورة.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lessons' && (
        <div className="max-w-2xl mx-auto glass-panel p-8 rounded-2xl border border-white/5 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <PlayCircle className="w-6 h-6 text-theme-neonPurple" />
            إضافة درس جديد لمنهج دراسي
          </h3>

          <form onSubmit={handleCreateLesson} className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold">اختر الدورة التعليمية</label>
              <select
                value={lessonCourseId}
                onChange={(e) => setLessonCourseId(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all cursor-pointer"
              >
                {coursesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold">ترتيب الدرس (Order)</label>
                <input
                  type="number"
                  value={lessonOrder}
                  onChange={(e) => setLessonOrder(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold">المدة التقديرية بالثواني</label>
                <input
                  type="number"
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold">عنوان الدرس</label>
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="مثال: مقدمة في الإضاءة ثلاثية الأبعاد"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold">نوع المنصة</label>
                <select
                  value={lessonPlatformType}
                  onChange={(e) => setLessonPlatformType(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all cursor-pointer"
                >
                  <option value="youtube">يوتيوب (YouTube)</option>
                  <option value="secure">فيديو محمي (Bunny.net)</option>
                  <option value="quiz">اختبار (Quiz Excel)</option>
                  <option value="homework">واجب (Homework Excel)</option>
                </select>
              </div>

              {lessonPlatformType === 'secure' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">رقم المكتبة (Library ID)</label>
                    <input
                      type="text"
                      value={lessonLibraryId}
                      onChange={(e) => setLessonLibraryId(e.target.value)}
                      placeholder="مثال: 669586"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-semibold">Token Key (اختياري)</label>
                    <input
                      type="text"
                      value={lessonTokenKey}
                      onChange={(e) => setLessonTokenKey(e.target.value)}
                      placeholder="اتركه فارغاً لاستخدام المفتاح الافتراضي"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all"
                    />
                  </div>
                </>
              )}

              {lessonPlatformType === 'quiz' && (
                <div className="col-span-1 sm:col-span-2 space-y-1.5 p-4 border border-dashed border-theme-neonCyan rounded-xl bg-theme-neonCyan/5">
                  <label className="text-theme-neonCyan text-xs font-semibold">ارفع ملف الأسئلة (Excel)</label>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-theme-neonCyan/20 file:text-theme-neonCyan hover:file:bg-theme-neonCyan/30 cursor-pointer"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    يجب أن يحتوي الملف على الأعمدة: Question, Option1, Option2, Option3, Option4, CorrectOption, Points
                  </p>
                  
                  {quizPreview.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-900 rounded-lg border border-white/5">
                      <h4 className="text-theme-neonCyan text-xs mb-2">معاينة البيانات (أول 5 صفوف):</h4>
                      <pre className="text-[10px] text-slate-300 overflow-auto max-h-40 custom-scrollbar">
                        {JSON.stringify(quizPreview, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {lessonPlatformType === 'homework' && (
                <div className="col-span-1 sm:col-span-2 space-y-1.5 p-4 border border-dashed border-amber-500 rounded-xl bg-amber-500/5">
                  <label className="text-amber-400 text-xs font-semibold">ارفع ملف الواجب (Excel)</label>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleHomeworkFileUpload}
                    className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500/20 file:text-amber-400 hover:file:bg-amber-500/30 cursor-pointer"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    يجب أن يحتوي الملف على الأعمدة: Question, Option1, Option2, Option3, Option4, CorrectOption, Points
                  </p>
                  {homeworkPreview.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-900 rounded-lg border border-white/5">
                      <h4 className="text-amber-400 text-xs mb-2">معاينة البيانات (أول 5 صفوف):</h4>
                      <pre className="text-[10px] text-slate-300 overflow-auto max-h-40 custom-scrollbar">
                        {JSON.stringify(homeworkPreview, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {lessonPlatformType !== 'quiz' && lessonPlatformType !== 'homework' && (
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold">
                  {lessonPlatformType === 'secure' ? 'معرف الفيديو (Video ID/GUID)' : 'رابط الفيديو (YouTube)'}
                </label>
                <input
                  type="text"
                  value={lessonVideo}
                  onChange={(e) => setLessonVideo(e.target.value)}
                  placeholder={lessonPlatformType === 'secure' ? "مثال: c97f708a-8ce9-46ee-b7a4-6882d56d4f40" : "https://www.youtube.com/watch?v=..."}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold">المحتوى النصي أو الشروحات</label>
              <textarea
                value={lessonContent}
                onChange={(e) => setLessonContent(e.target.value)}
                rows={4}
                placeholder="اكتب التوجيهات البرمجية أو النص المساعد هنا..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-theme-neonCyan transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-theme-neonPurple/15 border border-theme-neonPurple/30 hover:bg-theme-neonPurple hover:text-white text-theme-neonPurple font-bold transition-all duration-300 shadow-glow-purple cursor-pointer"
            >
              إدراج الدرس وتحديث المنهج الدراسي
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
