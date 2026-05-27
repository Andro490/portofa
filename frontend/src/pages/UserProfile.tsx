import React, { useState } from 'react';
import { useAppSelector } from '../hooks/redux';
import { 
  User, CreditCard, Link as LinkIcon, Wallet, BookOpen, 
  Shield, Eye, FileText, Star, Award, CheckSquare, 
  ClipboardList, PenTool, Database, HelpCircle, PlayCircle, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import CourseCard from '../components/CourseCard';

interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string | null;
  category: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  enrolledAt: string;
}

const SIDEBAR_ITEMS = [
  { id: 'profile', label: 'ملف المستخدم', icon: User, active: true },
  { id: 'charge', label: 'شحن كود سنتر', icon: CreditCard },
  { id: 'link_id', label: 'ربط ID سنتر', icon: LinkIcon },
  { id: 'balance', label: 'رصيدي', icon: Wallet },
  { id: 'my_courses', label: 'كورساتي', icon: BookOpen },
  { id: 'security', label: 'الأمان و تاريخ تسجيل الدخول', icon: Shield },
  { id: 'watch_history', label: 'تفاصيل المشاهدات', icon: Eye },
  { id: 'invoices', label: 'الفواتير', icon: FileText },
  { id: 'subscriptions', label: 'الاشتراكات', icon: Star },
  { id: 'exam_results', label: 'نتائج الامتحانات', icon: Award },
  { id: 'eval_results', label: 'نتائج اختبارات التقييم', icon: CheckSquare },
  { id: 'hw_results', label: 'نتائج الواجب', icon: ClipboardList },
  { id: 'custom_exam', label: 'امتحان خاص بيك', icon: PenTool },
  { id: 'question_bank', label: 'بنك الاسئلة', icon: Database },
];

const UserProfile = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(false);

  React.useEffect(() => {
    const fetchStudentDashboard = async () => {
      setLoadingCourses(true);
      try {
        const res = await api.get('/dashboard/student');
        setCourses(res.data.enrolledCourses || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchStudentDashboard();
  }, []);

  // حساب الإحصائيات ديناميكياً
  const totalEnrolledLessons = courses.reduce((sum, c) => sum + c.totalLessons, 0);
  const totalCompletedLessons = courses.reduce((sum, c) => sum + c.completedLessons, 0);
  const videoProgress = totalEnrolledLessons > 0 ? Math.round((totalCompletedLessons / totalEnrolledLessons) * 100) : 0;
  
  // بالنسبة للامتحانات (نضعها كـ 0 حالياً حتى يتم برمجة نظام الامتحانات في الباك إند)
  const totalExams = 0;
  const completedExams = 0;
  const examProgress = 0;

  // المستوى العام للطالب
  const overallPerformance = totalEnrolledLessons > 0 
    ? Math.round((videoProgress + examProgress) / 2) 
    : 0;

  const renderProfileStats = () => (
    <>
      {/* Profile Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-theme-neonCyan rounded-full flex items-center justify-center text-slate-900 mb-4 shadow-glow-cyan border-4 border-theme-bg">
            <User className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{user?.name || 'اسم المستخدم'}</h2>
          <div className="flex flex-col items-center text-slate-400 text-sm gap-1">
            <span>{user?.email || 'user@example.com'}</span>
          </div>
        </div>

      

        {/* Stats 1 */}
        <div className="mb-12 relative">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Star className="w-6 h-6 text-theme-neonCyan" />
            <h3 className="text-xl font-bold text-theme-neonCyan">احصائيات كورساتك</h3>
            <Star className="w-6 h-6 text-theme-neonCyan" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-4 border-theme-neonPurple flex flex-col items-center justify-center mb-3 text-white">
                <span className="text-xl font-bold">{videoProgress} %</span>
                <span className="text-xs">من الفيديوهات</span>
              </div>
              <span className="text-sm text-slate-300 font-semibold mb-2">إجمالي ما شاهدته</span>
              <span className="text-xs bg-theme-neonPurple text-white px-3 py-1 rounded-full">
                {totalCompletedLessons} فيديو - من {totalEnrolledLessons}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-4 border-theme-neonCyan flex flex-col items-center justify-center mb-3 text-white">
                <span className="text-xl font-bold">{examProgress} %</span>
                <span className="text-xs">من الاختبارات</span>
              </div>
              <span className="text-sm text-slate-300 font-semibold mb-2">الاختبارات المنجزة</span>
              <span className="text-xs bg-theme-neonCyan text-slate-900 font-bold px-3 py-1 rounded-full">
                {completedExams} امتحان - من {totalExams}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center mb-3 text-white">
                <span className="text-xl font-bold">{overallPerformance} %</span>
                <span className="text-xs">المستوى</span>
              </div>
              <span className="text-sm text-slate-300 font-semibold mb-2">مستواك العام (الالتزام)</span>
              <span className="text-xs bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold px-3 py-1 rounded-full">
                {overallPerformance >= 80 ? 'ممتاز 🚀' : overallPerformance >= 50 ? 'جيد جداً 👍' : 'تحتاج للمزيد من الجهد 🎯'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats 2 */}
        <div>
          <div className="flex items-center justify-center gap-4 mb-8">
            <Star className="w-6 h-6 text-theme-neonCyan" />
            <h3 className="text-xl font-bold text-theme-neonCyan">احصائياتك علي المنصة</h3>
            <Star className="w-6 h-6 text-theme-neonCyan" />
          </div>
          
          <div className="flex flex-col gap-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-slate-300">إجمالي عدد فتح المحاضرات في الموقع</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full border border-rose-500 text-rose-500">0 دقيقة</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-slate-300">إجمالي عدد مرات فتح الفيديوهات على الموقع</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full border border-yellow-500 text-yellow-500">0 مرة</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-slate-300">إجمالي عدد مرات فتح الاختبار</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full border border-theme-neonCyan text-theme-neonCyan">6 مرات</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-slate-300">إجمالي عدد مرات إنهاء الاختبار</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full border border-theme-neonPurple text-theme-neonPurple">12 مرة</span>
            </div>
          </div>
        </div>
    </>
  );

  const renderSubscriptions = () => (
    <div>
      <div className="flex flex-col items-center justify-center mb-10 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-2">كل الإشتراكات</h2>
        <div className="h-1 w-24 bg-theme-neonCyan rounded-full mx-auto" />
      </div>

      {loadingCourses ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-theme-neonCyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            // تحويل شكل البيانات لتتوافق مع مكون CourseCard
            const mappedCourse: any = {
              ...course,
              category: { name: course.category },
              lessons: new Array(course.totalLessons).fill(0)
            };
            
            return (
              <div key={course.id} className="relative group">
                <CourseCard course={mappedCourse} />
                
                {/* شريط نسبة الإنجاز والزر الإضافي فوق الكارت */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-end p-4 z-10">
                   <div className="bg-slate-900/90 backdrop-blur-sm p-3 rounded-xl border border-white/10 pointer-events-auto transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                        <span>نسبة الإنجاز</span>
                        <span className="text-theme-neonCyan font-bold">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5 mb-3">
                        <div
                          className="bg-gradient-to-l from-theme-accent to-theme-neonCyan h-full rounded-full"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <Link
                        to={`/courses/${course.id}/play`}
                        className="w-full bg-theme-accent hover:bg-theme-accent/80 text-white py-2 rounded-lg text-sm font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <PlayCircle className="w-4 h-4" />
                        الدخول للكورس
                      </Link>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Clock className="w-12 h-12 text-slate-500 mb-4 mx-auto" />
          <h3 className="text-lg font-semibold text-white mb-1">لا توجد اشتراكات حالياً</h3>
          <p className="text-slate-400 text-sm mb-6">لم تقم بالاشتراك في أي دورة بعد.</p>
          <Link to="/courses" className="px-6 py-3 rounded-xl bg-theme-accent text-white font-bold text-sm">
            تصفح الكورسات
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-24 rtl flex flex-col md:flex-row gap-8">
      
      {/* Right Sidebar */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3 mb-2 justify-center border border-white/5">
          <div className="w-12 h-12 rounded-full bg-theme-accent/20 border border-theme-accent/50 flex items-center justify-center text-theme-neonCyan">
            <User className="w-6 h-6" />
          </div>
        </div>
        <div className="glass-panel rounded-xl overflow-hidden border border-white/5 flex flex-col">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-300 border-b border-white/5 last:border-0 ${
                  isActive 
                    ? 'bg-gradient-to-r from-theme-accent to-theme-neonCyan text-white' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {isActive ? null : <Icon className="w-4 h-4" />}
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 glass-panel rounded-2xl border border-white/10 p-8 min-h-[500px]">
        {activeTab === 'profile' && renderProfileStats()}
        {activeTab === 'subscriptions' && renderSubscriptions()}
        {activeTab === 'my_courses' && renderSubscriptions()}
        {/* You can add more conditional renders for other tabs here */}
        {!['profile', 'subscriptions', 'my_courses'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4 mt-20">
            <HelpCircle className="w-12 h-12 opacity-50" />
            <p>هذه الصفحة قيد التطوير حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
