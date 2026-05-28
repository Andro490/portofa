import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchCourseById, enrollInCourse } from '../features/courses/coursesSlice';
import * as XLSX from 'xlsx';
import { Download, CreditCard, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';


const Checkout = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { currentCourse, loading } = useAppSelector((state) => state.courses);
  const { user } = useAppSelector((state) => state.auth);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchCourseById(id));
    }
  }, [id, dispatch]);

  const generateExcelInvoice = () => {
    if (!currentCourse || !user) return;

    // Create invoice data
    const invoiceData = [
      ['أكاديمية سينما - فاتورة دفع'],
      [],
      ['رقم الفاتورة:', `INV-${Math.floor(Math.random() * 1000000)}`],
      ['تاريخ الإصدار:', new Date().toLocaleDateString('ar-EG')],
      ['اسم الطالب:', user.name],
      ['البريد الإلكتروني:', user.email],
      [],
      ['تفاصيل الدفع'],
      ['اسم الدورة', 'التصنيف', 'السعر'],
      [
        currentCourse.title,
        currentCourse.category?.name || 'عام',
        currentCourse.price === 0 ? 'مجاني' : `${currentCourse.price} $`
      ],
      [],
      ['الإجمالي:', currentCourse.price === 0 ? '0 $' : `${currentCourse.price} $`]
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(invoiceData);
    
    // Set column widths
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }];

    // Create workbook and append sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');

    // Generate and download
    XLSX.writeFile(wb, `فاتورة_${currentCourse.title.replace(/\s+/g, '_')}.xlsx`);
  };

  const handlePayment = async () => {
    if (!id) return;
    setIsProcessing(true);

    try {
      if (currentCourse && currentCourse.price > 0) {
        // 1. استدعاء الـ API لتهيئة عملية الدفع مع البوابة المفعلة
        const res = await api.post('/payments/purchase', { courseId: id });
        const paymentData = res.data.gatewayResponse;

        if (paymentData) {
          if (paymentData.provider === 'FAWRY') {
            toast.loading(`جاري تحويلك لبوابة فوري... رقم الفاتورة: ${paymentData.referenceNumber}`, { duration: 3000 });
            // هنا في التطبيق الحقيقي يتم فتح واجهة فوري
            await new Promise((resolve) => setTimeout(resolve, 3000));
          } else if (paymentData.provider === 'STRIPE') {
            toast.loading(`جاري تجهيز بيئة سترايب للدفع...`, { duration: 3000 });
            // هنا في التطبيق الحقيقي يتم تحويلك لـ Stripe Checkout
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }
      } else {
        // محاكاة سريعة للكورسات المجانية
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      
      // 2. تسجيل الطالب الفعلي بعد تأكيد الدفع من البوابة (أو لأنه مجاني)
      await dispatch(enrollInCourse(id)).unwrap();
      
      setPaymentSuccess(true);
      toast.success('تم الدفع والتسجيل بنجاح!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'فشل الدفع، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || !currentCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center rtl">
        <div className="w-12 h-12 border-4 border-theme-neonCyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-24 rtl">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
      >
        <ArrowRight className="w-5 h-5" />
        العودة للدورة
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Invoice Summary */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-glass">
          <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/5 pb-4">ملخص الفاتورة</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center text-slate-300">
              <span>اسم الدورة:</span>
              <span className="font-semibold text-white">{currentCourse.title}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>الطالب:</span>
              <span className="font-semibold text-white">{user?.name}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>التاريخ:</span>
              <span className="font-semibold text-white">{new Date().toLocaleDateString('ar-EG')}</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-lg text-slate-300">المبلغ الإجمالي:</span>
              <span className="text-3xl font-extrabold text-theme-neonCyan">
                {currentCourse.price === 0 ? 'مجاني' : `${currentCourse.price} $`}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Action */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-glass flex flex-col justify-center items-center text-center">
          {paymentSuccess ? (
            <div className="space-y-6 animate-fade-in">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white">تم الدفع بنجاح!</h3>
              <p className="text-slate-400">تم تسجيلك في الدورة ويمكنك الآن تحميل الفاتورة (Excel) إذا أردت.</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={generateExcelInvoice}
                  className="w-full py-3 flex items-center justify-center gap-2 rounded-xl bg-theme-neonCyan/20 text-theme-neonCyan border border-theme-neonCyan/30 font-bold hover:bg-theme-neonCyan hover:text-slate-900 transition-all duration-300"
                >
                  <Download className="w-5 h-5" />
                  تحميل الفاتورة
                </button>
                <button
                  onClick={() => navigate(`/courses/${id}/play`)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-theme-accent to-theme-neonPurple text-white font-bold hover:shadow-glow-purple transition-all duration-300"
                >
                  دخول قاعة الدرس
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 w-full">
              <div className="w-20 h-20 bg-theme-neonPurple/20 text-theme-neonPurple rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white">إتمام عملية الدفع</h3>
              <p className="text-sm text-slate-400">بمجرد تأكيد الدفع، سيتم تسجيلك في الدورة وإصدار فاتورة لك.</p>
              
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-theme-accent via-theme-neonPurple to-theme-neonCyan text-white font-bold hover:shadow-glow-purple transition-all duration-300 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    تأكيد الدفع
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
