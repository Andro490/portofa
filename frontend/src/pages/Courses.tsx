import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchCourses, fetchCategories } from '../features/courses/coursesSlice';
import CourseCard from '../components/CourseCard';
import { BookOpen } from 'lucide-react';

const Courses = () => {
  const dispatch = useAppDispatch();
  const { courses, categories, loading } = useAppSelector((state) => state.courses);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchCategories());
  }, [dispatch]);

  const filteredCourses = selectedCategory === 'all'
    ? courses
    : courses.filter(c => c.categoryId === selectedCategory);

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 rtl">
      <div className="text-center max-w-xl mx-auto mb-16">
        <span className="text-theme-neonCyan text-xs font-bold uppercase tracking-wider">كتالوج البرامج</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-2 mb-4">استكشف جميع مساقاتنا</h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          اختر الدورة المناسبة لمستواك، وابدأ فوراً في تطبيق المشاريع العملية بمساعدة مدربين محترفين.
        </p>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-theme-accent text-white border-theme-accent shadow-glow-purple'
              : 'bg-theme-card/40 text-slate-400 border-white/5 hover:border-white/10 hover:text-white'
          }`}
        >
          الكل ({courses.length})
        </button>

        {categories.map((cat) => {
          const count = courses.filter(c => c.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-theme-accent text-white border-theme-accent shadow-glow-purple'
                  : 'bg-theme-card/40 text-slate-400 border-white/5 hover:border-white/10 hover:text-white'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-card rounded-2xl h-[420px] animate-pulse bg-slate-900/40 border border-white/5" />
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-16 text-center max-w-md mx-auto flex flex-col items-center">
          <BookOpen className="w-12 h-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-1">لا توجد مساقات في هذا القسم</h3>
          <p className="text-slate-400 text-sm">سنقوم بإدراج دورات جديدة في هذا التصنيف قريباً، يرجى تصفح بقية التصنيفات.</p>
        </div>
      )}
    </div>
  );
};

export default Courses;
