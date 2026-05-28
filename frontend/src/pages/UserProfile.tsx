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
import * as XLSX from 'xlsx';
import { Download, Filter, Zap, Trophy } from 'lucide-react';

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

interface ExamResult {
  id: string;
  quizId: string;
  courseId: string;
  lessonId: string;
  courseName: string;
  quizName: string;
  score: number;
  passed: boolean;
  date: string;
  answersJson: string;
}

const SIDEBAR_ITEMS = [
  { id: 'profile', label: 'ملف المستخدم', icon: User, active: true },
  { id: 'my_courses', label: 'كورساتي', icon: BookOpen },
  { id: 'invoices', label: 'الفواتير', icon: FileText },
  { id: 'subscriptions', label: 'الاشتراكات', icon: Star },
  { id: 'exam_results', label: 'نتائج الامتحانات', icon: Award },
  { id: 'eval_results', label: 'نقاطي', icon: Zap },
  { id: 'question_bank', label: 'اعلي 10', icon: Trophy },
  { id: 'hw_results', label: 'نتائج الواجب', icon: ClipboardList },
];

interface LeaderboardStudent {
  rank: number;
  id: string;
  name: string;
  points: number;
  type: string;
  grade: string;
  gov: string;
  dept: string;
}

const UserProfile = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [pointsFilter, setPointsFilter] = useState('all');
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [totalExams, setTotalExams] = useState<number>(0);
  const [completedExams, setCompletedExams] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardStudent[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  React.useEffect(() => {
    const fetchStudentDashboard = async () => {
      setLoadingCourses(true);
      try {
        const res = await api.get('/dashboard/student');
        setCourses(res.data.enrolledCourses || []);
        setExamResults(res.data.examResults || []);
        setTotalExams(res.data.totalExams || 0);
        setCompletedExams(res.data.completedExams || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCourses(false);
      }
    };
    
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const res = await api.get('/dashboard/leaderboard');
        setLeaderboard(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingLeaderboard(false);
      }
    };

    fetchStudentDashboard();
    fetchLeaderboard();
  }, []);

  const downloadInvoice = (course: EnrolledCourse) => {
    if (!user) return;

    const invoiceData = [
      ['أكاديمية سينما - فاتورة دفع'],
      [],
      ['رقم الفاتورة:', `INV-${Math.floor(Math.random() * 1000000)}`],
      ['تاريخ الإصدار:', new Date(course.enrolledAt || new Date()).toLocaleDateString('ar-EG')],
      ['اسم الطالب:', user.name],
      ['البريد الإلكتروني:', user.email],
      [],
      ['تفاصيل الدفع'],
      ['اسم الدورة', 'التصنيف', 'السعر'],
      [
        course.title,
        course.category || 'عام',
        course.price === 0 ? 'مجاني' : `${course.price} $`
      ],
      [],
      ['الإجمالي:', course.price === 0 ? '0 $' : `${course.price} $`]
    ];

    const ws = XLSX.utils.aoa_to_sheet(invoiceData);
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    XLSX.writeFile(wb, `فاتورة_${course.title.replace(/\s+/g, '_')}.xlsx`);
  };

  // حساب الإحصائيات ديناميكياً
  const totalEnrolledLessons = courses.reduce((sum, c) => sum + c.totalLessons, 0);
  const totalCompletedLessons = courses.reduce((sum, c) => sum + c.completedLessons, 0);
  const videoProgress = totalEnrolledLessons > 0 ? Math.round((totalCompletedLessons / totalEnrolledLessons) * 100) : 0;
  
  // 💡 ربط الإحصائيات الخاصة بالامتحانات من الباك إند
  const examProgress = totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0;

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
              <span className="text-sm text-slate-300">إجمالي الفيديوهات المتاحة في كورساتك</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full border border-rose-500 text-rose-500">{totalEnrolledLessons} درس</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-slate-300">إجمالي ما تم إنجازه</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full border border-yellow-500 text-yellow-500">{totalCompletedLessons} درس</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-slate-300">الكورسات المكتملة بنسبة 100%</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full border border-theme-neonCyan text-theme-neonCyan">{courses.filter(c => c.progress === 100).length} كورس</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-slate-300">الكورسات قيد التقدم حالياً</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full border border-theme-neonPurple text-theme-neonPurple">{courses.filter(c => c.progress > 0 && c.progress < 100).length} كورس</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-slate-300">الامتحانات التي اجتزتها بنجاح</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full border border-emerald-500 text-emerald-500">{completedExams} امتحان</span>
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

  const renderExamResults = () => (
    <div>
      <div className="flex flex-col items-center justify-center mb-10 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-2">نتائج الامتحانات</h2>
        <div className="h-1 w-24 bg-theme-neonCyan rounded-full mx-auto" />
      </div>

      {examResults.length > 0 ? (
        <div className="flex flex-col gap-4">
          {examResults.map((result) => (
            <div key={result.id} className="glass-panel p-5 rounded-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${result.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-rose-500/20 text-rose-400 border border-rose-500/50'}`}>
                  {result.score}%
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">{result.quizName}</h4>
                  <span className="text-xs text-slate-400">{result.courseName} - {new Date(result.date).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.passed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {result.passed ? 'ناجح' : 'لم يجتز'}
                </span>
                {/* 
                  هذا الزر ينقل المستخدم لشاشة عرض الكورس وتحديداً لدرس الامتحان مع تمرير الإجابات المحفوظة كـ state
                  بحيث إذا استقبلت صفحة CoursePlayer هذه البيانات يمكنها عرض الامتحان كـ "مراجعة" فقط 
                */}
                <Link
                  to={`/courses/${result.courseId}/play`}
                  state={{ reviewQuizId: result.lessonId, answers: JSON.parse(result.answersJson) }}
                  className="px-4 py-2 bg-theme-accent/20 hover:bg-theme-accent/40 text-theme-neonCyan border border-theme-accent/50 rounded-lg text-sm transition-all flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  مراجعة الإجابات الصحيحة
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Award className="w-12 h-12 text-slate-500 mb-4 mx-auto" />
          <h3 className="text-lg font-semibold text-white mb-1">لا توجد نتائج امتحانات</h3>
          <p className="text-slate-400 text-sm">لم تقم بإجراء أي امتحانات حتى الآن.</p>
        </div>
      )}
    </div>
  );

  const renderInvoices = () => (
    <div>
      <div className="flex flex-col items-center justify-center mb-10 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-2">الفواتير</h2>
        <div className="h-1 w-24 bg-theme-neonCyan rounded-full mx-auto" />
      </div>

      {loadingCourses ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-theme-neonCyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length > 0 ? (
        <div className="flex flex-col gap-4">
          {courses.map((course) => (
            <div key={course.id} className="glass-panel p-5 rounded-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-theme-neonCyan/20 flex items-center justify-center text-theme-neonCyan border border-theme-neonCyan/50">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">فاتورة: {course.title}</h4>
                  <span className="text-xs text-slate-400">تاريخ: {new Date(course.enrolledAt || new Date()).toLocaleDateString('ar-EG')} • السعر: {course.price === 0 ? 'مجاني' : `${course.price} $`}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => downloadInvoice(course)}
                  className="px-4 py-2 bg-theme-accent/20 hover:bg-theme-accent/40 text-theme-neonCyan border border-theme-accent/50 rounded-lg text-sm transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  تحميل (Excel)
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-slate-500 mb-4 mx-auto" />
          <h3 className="text-lg font-semibold text-white mb-1">لا توجد فواتير</h3>
          <p className="text-slate-400 text-sm">لم تقم بإجراء أي مدفوعات حتى الآن.</p>
        </div>
      )}
    </div>
  );

  const renderPoints = () => {
    const history: { id: string; title: string; points: number; type: string; date: string }[] = [];
    
    courses.forEach(course => {
      history.push({
        id: `sub_${course.id}`,
        title: `اشتراك في كورس: ${course.title}`,
        points: 20,
        type: 'subscription',
        date: course.enrolledAt || new Date().toISOString()
      });
      if (course.completedLessons > 0) {
        history.push({
          id: `vid_${course.id}`,
          title: `مشاهدة ${course.completedLessons} فيديوهات في: ${course.title}`,
          points: course.completedLessons * 5,
          type: 'videos',
          date: course.enrolledAt || new Date().toISOString()
        });
      }
    });

    examResults.forEach(exam => {
      history.push({
        id: `exam_${exam.id}`,
        title: `حل امتحان: ${exam.quizName}`,
        points: 10,
        type: 'exam',
        date: exam.date
      });
    });

    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const filteredHistory = history.filter(item => pointsFilter === 'all' || item.type === pointsFilter);
    const totalPoints = history.reduce((acc, curr) => acc + curr.points, 0);

    return (
      <div className="animate-fade-in">
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
            نقاطي
            <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400" />
          </h2>
          <div className="h-1 w-24 bg-theme-neonCyan rounded-full mx-auto" />
        </div>

        <div className="glass-panel p-6 rounded-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 border border-yellow-500/50">
              <Star className="w-8 h-8 fill-yellow-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">إجمالي النقاط</h3>
              <p className="text-sm text-slate-400">نقطة مكتسبة من تفاعلك</p>
            </div>
          </div>
          <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
            {totalPoints}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <h4 className="text-lg font-bold text-white">سجل النقاط ({filteredHistory.length})</h4>
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/50 p-1.5 rounded-lg border border-white/5">
            <button onClick={() => setPointsFilter('all')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${pointsFilter === 'all' ? 'bg-theme-accent text-white' : 'text-slate-400 hover:text-white'}`}>كل النقط</button>
            <button onClick={() => setPointsFilter('videos')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${pointsFilter === 'videos' ? 'bg-theme-accent text-white' : 'text-slate-400 hover:text-white'}`}>مشاهدة الفيديوهات</button>
            <button onClick={() => setPointsFilter('exam')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${pointsFilter === 'exam' ? 'bg-theme-accent text-white' : 'text-slate-400 hover:text-white'}`}>امتحان</button>
            <button onClick={() => setPointsFilter('subscription')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${pointsFilter === 'subscription' ? 'bg-theme-accent text-white' : 'text-slate-400 hover:text-white'}`}>اشتراك في كورس</button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map(item => (
              <div key={item.id} className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.type === 'subscription' ? 'bg-theme-neonPurple/20 text-theme-neonPurple' :
                    item.type === 'exam' ? 'bg-theme-neonCyan/20 text-theme-neonCyan' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {item.type === 'subscription' ? <Star className="w-5 h-5" /> : item.type === 'exam' ? <Award className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h5 className="text-white font-semibold text-sm mb-1">{item.title}</h5>
                    <span className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-bold text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full">
                  <span>+</span>
                  <span>{item.points}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm">
              لا توجد سجلات نقاط مطابقة.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTop10 = () => (
    <div className="animate-fade-in">
      <div className="flex flex-col items-center justify-center mb-10 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
          أعلى 10
          <Trophy className="w-8 h-8 text-theme-neonCyan" />
        </h2>
        <div className="h-1 w-24 bg-theme-neonCyan rounded-full mx-auto" />
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl border border-white/10 shadow-glass">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-white/5 text-slate-300 font-semibold border-b border-white/10">
              <tr>
                <th className="px-6 py-4">الترتيب</th>
                <th className="px-6 py-4">اسم الطالب</th>
                <th className="px-6 py-4">نوع التعليم</th>
                <th className="px-6 py-4">الصف الدراسي</th>
                <th className="px-6 py-4">المحافظة</th>
                <th className="px-6 py-4">القسم</th>
                <th className="px-6 py-4">النقاط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loadingLeaderboard ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="w-10 h-10 border-4 border-theme-neonCyan border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : leaderboard.length > 0 ? (
                leaderboard.map((student, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                        student.rank === 1 ? 'bg-yellow-500 text-slate-900 shadow-[0_0_10px_rgba(234,179,8,0.5)]' :
                        student.rank === 2 ? 'bg-slate-300 text-slate-900 shadow-[0_0_10px_rgba(203,213,225,0.5)]' :
                        student.rank === 3 ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.5)]' :
                        'bg-theme-neonCyan/20 text-theme-neonCyan'
                      }`}>
                        {student.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">{student.name}</td>
                    <td className="px-6 py-4 text-slate-400">{student.type}</td>
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{student.grade}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                        {student.gov}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-theme-neonPurple/10 text-theme-neonPurple border border-theme-neonPurple/20 text-xs">
                        {student.dept}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 font-bold border border-yellow-500/30">
                        {student.points}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    لا توجد بيانات متاحة حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
        {activeTab === 'exam_results' && renderExamResults()}
        {activeTab === 'invoices' && renderInvoices()}
        {activeTab === 'eval_results' && renderPoints()}
        {activeTab === 'question_bank' && renderTop10()}
        {/* You can add more conditional renders for other tabs here */}
        {!['profile', 'subscriptions', 'my_courses', 'exam_results', 'invoices', 'eval_results', 'question_bank'].includes(activeTab) && (
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
