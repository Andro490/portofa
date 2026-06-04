import { useState, useEffect } from 'react';
import api from '../services/api';
import { CheckCircle, XCircle, Award, RefreshCw, Maximize, ShieldAlert } from 'lucide-react';
import { useQuizSecurity } from '../hooks/useQuizSecurity';

interface Question {
  id: string;
  questionText: string;
  options: string[];
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  passScore: number;
  type?: 'practice' | 'exam'; // نوع الاختبار
  questions: Question[];
}

interface QuizResult {
  score: number;
  passed: boolean;
  earnedPoints: number;
  totalPoints: number;
  results: {
    questionId: string;
    isCorrect: boolean;
    correctOption: number;
  }[];
}

interface QuizComponentProps {
  lessonId: string;
  onQuizComplete?: () => void;
  reviewAnswers?: Record<string, number>;
}

const QuizComponent = ({ lessonId, onQuizComplete, reviewAnswers }: QuizComponentProps) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, number>>(reviewAnswers || {});
  const [isSubmitting, setIsSubmitting] = useState(!!reviewAnswers);
  const [result, setResult] = useState<QuizResult | null>(null);

  // ─── حالة بدء الاختبار ───────────────────────────────────────────────────
  // في وضع المراجعة نتجاوز شاشة البداية مباشرةً
  const [quizStarted, setQuizStarted] = useState(!!reviewAnswers);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers({});
    try {
      const res = await api.get(`/courses/lessons/${lessonId}/quiz`);
      const fetchedQuiz = res.data.quiz;
      setQuiz(fetchedQuiz);
      
      // إذا كان الاختبار "عادي" لا نعرض شاشة البداية ونبدأ فوراً
      if (fetchedQuiz.type !== 'exam' && !reviewAnswers) {
        setQuizStarted(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'تعذر تحميل الاختبار');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [lessonId]);

  const submitQuizData = async (answersToSubmit: Record<string, number>) => {
    if (!quiz) return;
    setIsSubmitting(true);
    try {
      const res = await api.post(`/courses/lessons/${lessonId}/quiz/submit`, { answers: answersToSubmit });
      setResult(res.data);
      if (res.data.passed && onQuizComplete && !reviewAnswers) {
        onQuizComplete();
      }
    } catch (err: any) {
      alert('حدث خطأ أثناء تحميل نتيجة الاختبار.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── دالة التسليم التلقائي (تُستدعى من الـ Hook عند تجاوز حد التبديل) ───
  const autoSubmit = async () => {
    if (result || isSubmitting) return; // تجنّب التكرار
    await submitQuizData(answers);
  };

  const isExam = quiz?.type === 'exam';
  
  const { startQuiz, resumeQuiz, isBlocked, switchCount, warningText } = useQuizSecurity({
    onAutoSubmit: autoSubmit,
    switchLimit: 3,
    enabled: isExam, // تفعيل الحماية فقط في الاختبار النهائي
  });

  // ─── بدء الاختبار (يُربط بزر "ابدأ الاختبار") ────────────────────────────
  const handleStartQuiz = () => {
    if (isExam) {
      startQuiz();         // يفتح ملء الشاشة ويبدأ المراقبة
    }
    setQuizStarted(true);
  };

  // If we are in review mode (reviewAnswers provided), we want to submit the answers 
  // immediately after loading the quiz to get the correct results.
  useEffect(() => {
    if (quiz && reviewAnswers && !result) {
      submitQuizData(reviewAnswers);
    }
  }, [quiz]);

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    if (result) return; // Prevent changing answer after submit
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    
    // Check if all questions are answered
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < quiz.questions.length) {
      alert('الرجاء الإجابة على جميع الأسئلة قبل تسليم الاختبار.');
      return;
    }

    await submitQuizData(answers);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-theme-neonCyan">
        <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin mb-4" />
        <p>جاري تحميل الاختبار...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-red-400 gap-3">
        <XCircle className="w-12 h-12" />
        <p>{error || 'لم يتم العثور على الاختبار'}</p>
        <button onClick={fetchQuiz} className="mt-4 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white hover:bg-slate-700">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl p-6 md:p-10 border border-slate-300 dark:border-white/10 shadow-glow-purple">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 border-4 ${result.passed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
            {result.passed ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {result.passed ? 'مبروك! لقد اجتزت الاختبار بنجاح' : 'للأسف لم تجتز الاختبار هذه المرة'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            لقد حصلت على <strong className="text-theme-neonCyan">{result.score}%</strong> (الدرجة المطلوبة: {quiz.passScore}%)
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            مجموع النقاط: {result.earnedPoints} من {result.totalPoints}
          </p>
        </div>

        {/* ✅ مراجعة الإجابات تظهر فقط في وضع المراجعة (من صفحة Exam Results) */}
        {reviewAnswers ? (
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/5 pb-3">مراجعة الإجابات:</h3>
            {quiz.questions.map((q, idx) => {
              const answerRes = result.results.find(r => r.questionId === q.id);
              const isCorrect = answerRes?.isCorrect;
              
              return (
                <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="flex gap-3 mb-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                      {idx + 1}
                    </span>
                    <p className="text-slate-900 dark:text-white font-medium">{q.questionText}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-9">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = answers[q.id] === optIdx;
                      const isActualCorrect = answerRes?.correctOption === optIdx;
                      
                      let bgClass = "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400";
                      if (isActualCorrect) bgClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-bold";
                      else if (isSelected && !isActualCorrect) bgClass = "bg-red-500/20 border-red-500/50 text-red-400";
                      
                      return (
                        <div key={optIdx} className={`p-2.5 rounded-lg border text-sm flex items-center justify-between ${bgClass}`}>
                          <span>{opt}</span>
                          {isActualCorrect && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                          {isSelected && !isActualCorrect && <XCircle className="w-4 h-4 text-red-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // ✅ بعد التسليم العادي: رسالة توجيهية بدلاً من الإجابات
          <div className="flex flex-col items-center justify-center py-8 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10">
            <Award className="w-12 h-12 text-theme-neonCyan mb-3 opacity-60" />
            <p className="text-slate-600 dark:text-slate-400 text-center text-sm">
              لمراجعة إجاباتك والاطلاع على الإجابات الصحيحة،
            </p>
            <p className="text-theme-neonCyan font-semibold text-sm mt-1">
              اذهب إلى: لوحة الطالب → Exam Results → Review correct answers
            </p>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-300 dark:border-white/10 flex justify-center">
          {!reviewAnswers && (
            <button
              onClick={fetchQuiz}
              className="flex items-center gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl transition-all font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة الاختبار
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── شاشة البداية ────────────────────────────────────────────────────────
  if (!quizStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-950 rounded-xl border border-white/5 shadow-glow-purple p-8 gap-6 text-center" dir="rtl">
        {/* أيقونة */}
        <div className="w-20 h-20 rounded-full bg-theme-accent/10 border border-theme-accent/30 flex items-center justify-center mb-2">
          <ShieldAlert className="w-10 h-10 text-theme-accent" />
        </div>

        {/* عنوان وتفاصيل الاختبار */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{quiz.title}</h2>
          <p className="text-slate-400 text-sm">
            {quiz.questions.length} أسئلة • درجة النجاح: {quiz.passScore}%
          </p>
        </div>

        {/* تعليمات الأمان */}
        <div className="bg-slate-900/80 border border-yellow-500/20 rounded-xl p-4 max-w-sm text-right space-y-2">
          <p className="text-yellow-400 font-semibold text-sm mb-3 flex items-center gap-2 justify-end">
            <span>تعليمات مهمة قبل البدء</span>
            <ShieldAlert className="w-4 h-4" />
          </p>
          <p className="text-slate-300 text-sm">🔒 يجب إبقاء التركيز على صفحة الاختبار دائماً</p>
          <p className="text-slate-300 text-sm">👁️ أي تبديل للتبويبات سيُسجَّل كمحاولة غش</p>
          <p className="text-slate-300 text-sm">⚠️ بعد 3 تحذيرات سيُسلَّم الاختبار تلقائياً</p>
          <p className="text-slate-300 text-sm">🚫 النسخ واللصق وأدوات المطوّر معطّلة</p>
        </div>

        {/* زر البدء */}
        <button
          id="start-quiz-btn"
          onClick={handleStartQuiz}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-theme-accent to-theme-neonCyan text-slate-900 rounded-xl text-lg font-bold shadow-glow-cyan hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <Maximize className="w-5 h-5" />
          ابدأ الاختبار
        </button>
      </div>
    );
  }

  // ─── الاختبار الرئيسي ─────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-glow-purple relative ${isExam ? 'select-none' : ''}`}>

      {/* ── الـ Overlay (يظهر عند محاولة الغش أو الخروج من الصفحة) ── */}
      {isBlocked && (
        <div className="absolute inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
          <div className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center mb-6 animate-pulse">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">تم إخفاء الاختبار</h2>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-lg mb-8">
            <p className="text-red-400 text-lg whitespace-pre-line leading-relaxed">
              {warningText}
            </p>
          </div>
          
          <button
            onClick={resumeQuiz}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
          >
            <Maximize className="w-5 h-5" />
            العودة للاختبار
          </button>
          
          <p className="mt-6 text-slate-400 text-sm animate-pulse">
            يُرجى الضغط على الزر للعودة للصفحة ليعود الاختبار للظهور...
          </p>
        </div>
      )}

      {/* ── شريط حالة الأمان ── */}
      {isExam && (
        <div className="bg-slate-900/90 backdrop-blur border-b border-white/5 px-4 py-2 flex items-center justify-between gap-3 text-xs" dir="rtl">
          {/* حالة المراقبة */}
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldAlert className="w-3 h-3" />
            المراقبة نشطة
          </span>

          {/* عداد التبديل */}
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium ${
            switchCount === 0
              ? 'bg-slate-800 text-slate-400 border border-white/5'
              : switchCount >= 2
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
              : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
          }`}>
            <ShieldAlert className="w-3 h-3" />
            تحذيرات: {switchCount} / 3
          </span>
        </div>
      )}

      {/* Quiz Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-theme-neonCyan">{quiz.title}</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            يحتوي هذا الاختبار على {quiz.questions.length} أسئلة • درجة النجاح: {quiz.passScore}%
          </p>
        </div>
        <div className="bg-theme-accent/10 border border-theme-accent/30 text-theme-accent px-4 py-2 rounded-lg text-sm font-bold shrink-0 text-center">
          مجاب: {Object.keys(answers).length} / {quiz.questions.length}
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 p-5 rounded-2xl">
            <div className="flex gap-4 mb-5">
              <span className="shrink-0 w-8 h-8 rounded-full bg-theme-accent text-slate-900 dark:text-white flex items-center justify-center font-bold shadow-lg">
                {idx + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">{q.questionText}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 block">{q.points} نقاط</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
              {q.options.map((opt, optIdx) => {
                const isSelected = answers[q.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleOptionSelect(q.id, optIdx)}
                    className={`text-right p-4 rounded-xl border transition-all duration-300 ${
                      isSelected
                        ? 'bg-theme-accent/20 border-theme-accent text-slate-900 dark:text-white shadow-glow-purple scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'border-theme-neonCyan bg-theme-neonCyan/20' : 'border-slate-500'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-theme-neonCyan" />}
                      </div>
                      <span className="font-medium">{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 p-4 flex justify-end">
        <button
          id="submit-quiz-btn"
          onClick={handleSubmit}
          disabled={isSubmitting || Object.keys(answers).length === 0}
          className="bg-gradient-to-r from-theme-accent to-theme-neonCyan text-slate-900 dark:text-white px-8 py-3 rounded-xl font-bold shadow-glow-cyan hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              جاري التسليم...
            </>
          ) : (
            'تسليم الاختبار'
          )}
        </button>
      </div>
    </div>
  );
};

export default QuizComponent;
