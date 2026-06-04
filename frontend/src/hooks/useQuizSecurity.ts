/**
 * useQuizSecurity Hook
 * =====================
 * يوفر هذا الـ Hook ثلاثة أنظمة أمان للاختبارات:
 * 1. وضع ملء الشاشة (Fullscreen API)
 * 2. مراقبة التبديل بين التبويبات (Page Visibility API)
 * 3. تعطيل أدوات الغش (Right-click, Copy, Paste, Cut)
 *
 * طريقة الاستخدام:
 *   const { startQuiz, isFullscreen } = useQuizSecurity({ onAutoSubmit: handleSubmit });
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── الأنواع ────────────────────────────────────────────────────────────────

interface UseQuizSecurityOptions {
  /** الدالة التي تُستدعى تلقائياً عند تجاوز حد التبديل */
  onAutoSubmit: () => void;
  /** عدد مرات التبديل المسموح بها قبل التسليم التلقائي (الافتراضي: 3) */
  switchLimit?: number;
}

interface UseQuizSecurityReturn {
  /** استدعاء هذه الدالة عند الضغط على زر "ابدأ الاختبار" */
  startQuiz: () => void;
  /** هل المتصفح في وضع ملء الشاشة حالياً */
  isFullscreen: boolean;
  /** عدد مرات التبديل الحالية */
  switchCount: number;
}

// ─── الـ Hook الرئيسي ────────────────────────────────────────────────────────

export function useQuizSecurity({
  onAutoSubmit,
  switchLimit = 3,
}: UseQuizSecurityOptions): UseQuizSecurityReturn {
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [switchCount, setSwitchCount] = useState(0);

  // نستخدم ref لقراءة أحدث قيمة داخل event listeners دون إعادة تسجيلها
  const switchCountRef = useRef(0);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const isQuizActiveRef = useRef(false);

  // تحديث الـ ref عند تغيير الـ callback
  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit;
  }, [onAutoSubmit]);

  // ─── 1. وضع ملء الشاشة ───────────────────────────────────────────────────

  const enterFullscreen = useCallback(async () => {
    const el = document.documentElement;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        // Safari
        await (el as any).webkitRequestFullscreen();
      } else if ((el as any).mozRequestFullScreen) {
        // Firefox القديم
        await (el as any).mozRequestFullScreen();
      } else if ((el as any).msRequestFullscreen) {
        // IE/Edge القديم
        await (el as any).msRequestFullscreen();
      }
    } catch (err) {
      console.warn('[QuizSecurity] تعذّر الدخول في وضع ملء الشاشة:', err);
    }
  }, []);

  // مراقبة تغيير حالة ملء الشاشة (مثلاً إذا ضغط المستخدم Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // ─── 2. مراقبة التبديل (Page Visibility API) ────────────────────────────

  useEffect(() => {
    const handleVisibilityChange = () => {
      // نتجاهل الحدث إذا لم يبدأ الاختبار بعد
      if (!isQuizActiveRef.current) return;

      if (document.hidden) {
        const newCount = switchCountRef.current + 1;
        switchCountRef.current = newCount;
        setSwitchCount(newCount);

        if (newCount >= switchLimit) {
          // تجاوز الحد → تسليم تلقائي
          // ملاحظة: لا نُعيد ملء الشاشة هنا لأن الاختبار سينتهي
          alert(
            `⚠️ تحذير أخير!\n\nلقد قمت بالتبديل ${newCount} مرات. سيتم تسليم اختبارك الآن تلقائياً.`
          );
          isQuizActiveRef.current = false;
          onAutoSubmitRef.current();
        } else {
          // تحذير عادي
          const remaining = switchLimit - newCount;
          alert(
            `⚠️ تحذير (${newCount}/${switchLimit})\n\nتم رصد مغادرتك لصفحة الاختبار.\n` +
            `متبقي لك ${remaining} ${remaining === 1 ? 'محاولة' : 'محاولات'} قبل التسليم التلقائي.`
          );
          // ✅ إعادة ملء الشاشة بعد إغلاق الـ alert
          // (المتصفح يُخرج من fullscreen تلقائياً عند ظهور alert)
          enterFullscreen();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [switchLimit, enterFullscreen]);

  // ─── 3. تعطيل أدوات الغش ────────────────────────────────────────────────

  useEffect(() => {
    /** منع النقر الأيمن */
    const preventContextMenu = (e: MouseEvent) => {
      if (!isQuizActiveRef.current) return;
      e.preventDefault();
    };

    /** تعطيل اختصارات النسخ واللصق والقص + DevTools */
    const preventShortcuts = (e: KeyboardEvent) => {
      if (!isQuizActiveRef.current) return;

      const blockedKeys = ['c', 'v', 'x', 'u', 'a', 's', 'p'];
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // تعطيل Ctrl+C, V, X, U, A, S, P
      if (isCtrlOrCmd && blockedKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }

      // تعطيل F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
      }

      // تعطيل Ctrl+Shift+I/J/C (DevTools)
      if (isCtrlOrCmd && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    /** منع السحب والإفلات للنص */
    const preventDragStart = (e: DragEvent) => {
      if (isQuizActiveRef.current) e.preventDefault();
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventShortcuts);
    document.addEventListener('dragstart', preventDragStart);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventShortcuts);
      document.removeEventListener('dragstart', preventDragStart);
    };
  }, []);

  // ─── دالة البدء (تُربط بزر "ابدأ الاختبار") ─────────────────────────────

  const startQuiz = useCallback(() => {
    // إعادة تعيين العداد
    switchCountRef.current = 0;
    setSwitchCount(0);
    isQuizActiveRef.current = true;

    // الدخول في وضع ملء الشاشة
    enterFullscreen();
  }, [enterFullscreen]);

  return { startQuiz, isFullscreen, switchCount };
}
