/**
 * useQuizSecurity Hook — v2
 * =========================
 * نظام حماية الاختبار المتكامل:
 *
 * 1. Fullscreen API  — إجبار المتصفح على ملء الشاشة
 * 2. Overlay System  — إخفاء الاختبار عند الخروج أو تبديل التبويب
 * 3. Warning Counter — عدّاد التحذيرات (يُسلَّم تلقائياً عند التجاوز)
 * 4. Anti-Cheat     — تعطيل النسخ/اللصق والنقر الأيمن وDevTools
 *
 * الـ States المُرجَعة:
 *   startQuiz()   — استدعِها عند الضغط على "ابدأ الاختبار"
 *   isBlocked     — true  → أظهر الـ Overlay
 *   isFullscreen  — true  → المتصفح في وضع ملء الشاشة
 *   switchCount   — عدد مرات الانتهاك المُسجَّلة
 *   warningText   — نص التحذير المناسب للعرض في الـ Overlay
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── الأنواع ────────────────────────────────────────────────────────────────

interface UseQuizSecurityOptions {
  /** الدالة التي تُستدعى تلقائياً عند تجاوز حد الانتهاكات */
  onAutoSubmit: () => void;
  /** عدد الانتهاكات المسموح بها قبل التسليم التلقائي (الافتراضي: 3) */
  switchLimit?: number;
  /** تفعيل أو تعطيل وضع الحماية (مفيد للاختبارات العادية التي لا تحتاج قيود) */
  enabled?: boolean;
}

interface UseQuizSecurityReturn {
  /** استدعاء هذه الدالة عند الضغط على زر "ابدأ الاختبار" */
  startQuiz: () => void;
  /** true = يجب إظهار الـ Overlay الآن */
  isBlocked: boolean;
  /** true = المتصفح في وضع ملء الشاشة */
  isFullscreen: boolean;
  /** عدد مرات الانتهاك المُسجَّلة */
  switchCount: number;
  /** نص التحذير يُعرَض داخل الـ Overlay */
  warningText: string;
}

// ─── الـ Hook الرئيسي ────────────────────────────────────────────────────────

export function useQuizSecurity({
  onAutoSubmit,
  switchLimit = 3,
  enabled = true,
}: UseQuizSecurityOptions): UseQuizSecurityReturn {

  const [isBlocked, setIsBlocked]     = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [switchCount, setSwitchCount] = useState(0);
  const [warningText, setWarningText] = useState('');

  // Refs — نقرأ منها داخل event listeners بدون إعادة تسجيلها
  const isBlockedRef       = useRef(false);
  const switchCountRef     = useRef(0);
  const isQuizActiveRef    = useRef(false);
  const onAutoSubmitRef    = useRef(onAutoSubmit);
  const autoSubmitCalledRef = useRef(false); // منع التسليم المزدوج

  useEffect(() => { onAutoSubmitRef.current = onAutoSubmit; }, [onAutoSubmit]);

  // ─── 1. Fullscreen API ────────────────────────────────────────────────────

  const enterFullscreen = useCallback(async () => {
    if (!enabled) return; // لا تفعل شيء إذا كان الحماية معطلة
    if (document.fullscreenElement) return; // مفعّل مسبقاً
    const el = document.documentElement;
    try {
      if      (el.requestFullscreen)             await el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen();
      else if ((el as any).mozRequestFullScreen)    await (el as any).mozRequestFullScreen();
      else if ((el as any).msRequestFullscreen)     await (el as any).msRequestFullscreen();
    } catch (err) {
      console.warn('[QuizSecurity] لم يُمكن الدخول لملء الشاشة:', err);
    }
  }, [enabled]);

  // مراقبة حالة fullscreen (تتغير عند ضغط Escape أو التبديل)
  useEffect(() => {
    if (!enabled) return;
    const onFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (isQuizActiveRef.current) evaluateBlockState();
    };

    document.addEventListener('fullscreenchange',       onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange',    onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange',       onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange',    onFullscreenChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 2. منطق الـ Overlay (القلب الرئيسي) ────────────────────────────────

  /**
   * evaluateBlockState
   * ------------------
   * تُحدد إذا كان يجب إظهار الـ Overlay أم إخفاؤه.
   * تُستدعى من كل من visibilitychange و fullscreenchange.
   */
  const evaluateBlockState = useCallback(() => {
    if (!enabled || !isQuizActiveRef.current) return;

    const isTabHidden    = document.hidden;
    const isNotFullscreen = !document.fullscreenElement;

    // يجب الحجب إذا كان التبويب مخفياً أو خرج من fullscreen
    const shouldBlock = isTabHidden || isNotFullscreen;

    if (shouldBlock && !isBlockedRef.current) {
      // ── انتقال جديد من مفتوح → محجوب: سجّل الانتهاك ──
      isBlockedRef.current = true;
      setIsBlocked(true);

      const newCount = switchCountRef.current + 1;
      switchCountRef.current = newCount;
      setSwitchCount(newCount);

      if (newCount >= switchLimit) {
        // آخر انتهاك → حجب نهائي + تسليم تلقائي بعد ثانيتين
        setWarningText(
          `⛔ تجاوزت الحد المسموح به (${switchLimit} انتهاكات)\n` +
          `سيتم تسليم اختبارك تلقائياً خلال ثانيتين...`
        );
        if (!autoSubmitCalledRef.current) {
          autoSubmitCalledRef.current = true;
          isQuizActiveRef.current = false;
          setTimeout(() => onAutoSubmitRef.current(), 2000);
        }
      } else {
        const remaining = switchLimit - newCount;
        setWarningText(
          `⚠️ انتهاك ${newCount} من ${switchLimit}\n` +
          `تم إخفاء الاختبار. ارجع لوضع ملء الشاشة للمتابعة.\n` +
          `(متبقي: ${remaining} ${remaining === 1 ? 'محاولة' : 'محاولات'})`
        );
      }

    } else if (!shouldBlock && isBlockedRef.current) {
      // ── عاد الطالب: أزل الحجب ──
      isBlockedRef.current = false;
      setIsBlocked(false);
      setWarningText('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [switchLimit, enabled]);

  // ─── 3. Page Visibility API ───────────────────────────────────────────────

  useEffect(() => {
    if (!enabled) return;
    const onVisibilityChange = () => {
      if (!isQuizActiveRef.current) return;
      evaluateBlockState();

      // عند العودة للصفحة: أعد ملء الشاشة تلقائياً
      if (!document.hidden && !document.fullscreenElement) {
        enterFullscreen();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [evaluateBlockState, enterFullscreen, enabled]);

  // ─── 4. تعطيل أدوات الغش ─────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled) return;
    const preventContextMenu = (e: MouseEvent) => {
      if (isQuizActiveRef.current) e.preventDefault();
    };

    const preventShortcuts = (e: KeyboardEvent) => {
      if (!isQuizActiveRef.current) return;
      const blocked = ['c', 'v', 'x', 'u', 'a', 's', 'p'];
      if ((e.ctrlKey || e.metaKey) && blocked.includes(e.key.toLowerCase())) {
        e.preventDefault(); return;
      }
      if (e.key === 'F12') { e.preventDefault(); return; }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i','j','c'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    const preventDrag = (e: DragEvent) => {
      if (isQuizActiveRef.current) e.preventDefault();
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown',     preventShortcuts);
    document.addEventListener('dragstart',   preventDrag);
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown',     preventShortcuts);
      document.removeEventListener('dragstart',   preventDrag);
    };
  }, []);

  // ─── 5. دالة البدء ───────────────────────────────────────────────────────

  const startQuiz = useCallback(() => {
    switchCountRef.current    = 0;
    autoSubmitCalledRef.current = false;
    isQuizActiveRef.current   = true;
    isBlockedRef.current      = false;
    setSwitchCount(0);
    setIsBlocked(false);
    setWarningText('');
    enterFullscreen();
  }, [enterFullscreen]);

  return { startQuiz, isBlocked, isFullscreen, switchCount, warningText };
}
