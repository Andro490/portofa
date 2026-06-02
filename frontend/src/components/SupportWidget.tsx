import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import api from '../services/api';
import { useAppSelector } from '../hooks/redux';

export const SupportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // If user is logged in, prefill the name and email
  const { user } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('loading');
    try {
      await api.post('/support', {
        name: user?.name || name || 'زائر',
        email: user?.email || email || 'emelnasr@gmail.com',
        message
      });
      setStatus('success');
      setTimeout(() => {
        setIsOpen(false);
        setMessage('');
        setStatus('idle');
      }, 3000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 glass-card rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 rtl">
          <div className="bg-theme-neonPurple text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm">خدمة العملاء الدعم الفني</h3>
              <p className="text-[10px] opacity-80">راسلنا على: emelnasr@gmail.com</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-5 bg-white dark:bg-slate-900">
            {status === 'success' ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckIcon />
                </div>
                <h4 className="font-bold text-emerald-500 text-sm">تم إرسال رسالتك بنجاح!</h4>
                <p className="text-xs text-slate-500 mt-1">سنتواصل معك في أقرب وقت.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 text-sm">
                {!user && (
                  <>
                    <input
                      type="text"
                      placeholder="الاسم (اختياري)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-theme-neonPurple transition-all"
                    />
                    <input
                      type="email"
                      placeholder="البريد الإلكتروني للرد"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-theme-neonPurple transition-all"
                    />
                  </>
                )}
                
                <textarea
                  placeholder="كيف يمكننا مساعدتك؟"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-theme-neonPurple transition-all"
                />
                
                <button
                  type="submit"
                  disabled={status === 'loading' || !message.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-theme-neonPurple text-white font-bold hover:bg-theme-neonPurple/90 transition-all shadow-glow-purple disabled:opacity-50"
                >
                  {status === 'loading' ? 'جاري الإرسال...' : (
                    <>
                      <span>إرسال</span>
                      <Send className="w-4 h-4 rtl:-scale-x-100" />
                    </>
                  )}
                </button>
                {status === 'error' && (
                  <p className="text-xs text-red-500 text-center">حدث خطأ، يرجى المحاولة لاحقاً</p>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-theme-neonPurple text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:scale-110 transition-transform duration-300"
        title="تواصل مع الدعم"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
};

const CheckIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
