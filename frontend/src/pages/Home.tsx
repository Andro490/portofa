import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchCourses } from '../features/courses/coursesSlice';
import CourseCard from '../components/CourseCard';
import { gsap } from 'gsap';
import { ArrowLeft, Play, Cpu, Palette, Sparkles, BookOpen } from 'lucide-react';

const Home = () => {
  const dispatch = useAppDispatch();
  const { courses, loading } = useAppSelector((state) => state.courses);

  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchCourses());

    // GSAP Reveal Animation
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    
    tl.to(headlineRef.current, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      delay: 0.2
    })
    .to(subtextRef.current, {
      opacity: 1,
      y: 0,
      duration: 1.0,
    }, '-=0.8')
    .to(ctaRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
    }, '-=0.6')
    .to(featuresRef.current?.children || [], {
      opacity: 1,
      y: 0,
      stagger: 0.15,
      duration: 0.8,
    }, '-=0.4');

  }, [dispatch]);

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 rtl">
      {/* 1. Cinematic Hero Section */}
      <div className="flex flex-col items-center text-center justify-center min-h-[70vh] relative pt-12">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-theme-accent/20 rounded-full blur-[100px] -z-10 pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-[250px] h-[250px] bg-theme-neonCyan/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

        <span className="text-theme-neonCyan text-xs sm:text-sm font-bold tracking-widest uppercase border border-theme-neonCyan/30 bg-theme-neonCyan/5 px-4 py-2 rounded-full mb-6 inline-block animate-bounce">
          مستقبل التعليم الرقمي ثلاثي الأبعاد 🚀
        </span>

        {/* Massive Headline */}
        <h1
          ref={headlineRef}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.15] mb-6 opacity-0 translate-y-8"
        >
          اصنع مسارك البرمجي <br />
          <span className="text-gradient-purple-cyan font-extrabold">بلمسة سينمائية مذهلة</span>
        </h1>

        {/* Hero Subtext */}
        <p
          ref={subtextRef}
          className="text-slate-400 text-base sm:text-xl max-w-2xl leading-relaxed mb-10 opacity-0 translate-y-6"
        >
          أكاديمية تفاعلية مصممة خصيصاً للمبرمجين والمصممين الساعين للاحتراف. تعلم بناء واجهات الويب ثلاثية الأبعاد بـ Three.js وتصميم تفاعلات سلسة كالحرير.
        </p>

        {/* Call To Actions */}
        <div
          ref={ctaRef}
          className="flex flex-col sm:flex-row items-center gap-5 opacity-0 translate-y-6"
        >
          <Link
            to="/courses"
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-theme-accent via-theme-neonPurple to-theme-neonCyan text-white font-bold hover:shadow-glow-purple transition-all duration-300 transform hover:scale-[1.02] flex items-center gap-2 group cursor-pointer"
          >
            استكشف الدورات التعليمية
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1.5 transition-transform" />
          </Link>
          
          <Link
            to="/login"
            className="px-8 py-4 rounded-xl bg-slate-900/60 border border-white/10 hover:border-theme-neonCyan/50 hover:bg-slate-900 text-slate-200 font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4.5 h-4.5 text-theme-neonCyan fill-theme-neonCyan" />
            جرب منصتنا مجاناً
          </Link>
        </div>
      </div>

      {/* 2. Platform Value Propositions */}
      <div
        ref={featuresRef}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24"
      >
        <div className="glass-card rounded-2xl p-8 flex flex-col items-start opacity-0 translate-y-8">
          <div className="w-12 h-12 rounded-xl bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-center text-theme-accent mb-6 shadow-glow-purple">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-3">تقنيات ثلاثية الأبعاد</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            مناهج عملية مركزة في تصميم وتطوير المواقع التفاعلية ثلاثية الأبعاد بالكامل باستخدام Three.js و Shaders.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 flex flex-col items-start opacity-0 translate-y-8">
          <div className="w-12 h-12 rounded-xl bg-theme-neonCyan/15 border border-theme-neonCyan/30 flex items-center justify-center text-theme-neonCyan mb-6 shadow-glow-cyan">
            <Palette className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-3">جماليات بصرية ممتازة</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            لا نكتفي بتدريس الكود؛ بل نعلمك فلسفة الجمال وتأثيرات الزجاج (Glassmorphism) لتجعل تصميماتك تبدو فخمة وجذابة.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 flex flex-col items-start opacity-0 translate-y-8">
          <div className="w-12 h-12 rounded-xl bg-theme-neonPurple/15 border border-theme-neonPurple/30 flex items-center justify-center text-theme-neonPurple mb-6">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-3">تحريكات فائقة السلاسة</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            احصل على تحريكات تعتمد على حركة الفأرة والتمرير باستخدام مكتبات GSAP المتكاملة التي تبهر زوار موقعك.
          </p>
        </div>
      </div>

      {/* 3. Featured Courses Section */}
      <div className="mt-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-theme-neonCyan text-xs font-bold uppercase tracking-wider">البرامج المختارة</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">ابدأ رحلتك التعليمية اليوم</h2>
          </div>
          <Link
            to="/courses"
            className="text-theme-neonCyan hover:underline text-sm font-semibold flex items-center gap-1"
          >
            مشاهدة جميع الدورات
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-card rounded-2xl h-[420px] animate-pulse bg-slate-900/40 border border-white/5" />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <BookOpen className="w-12 h-12 text-slate-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">لا توجد دورات متاحة حالياً</h3>
            <p className="text-slate-400 text-sm">يرجى التحقق في وقت لاحق أو تسجيل الدخول وتنشيط خادم البيانات.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
