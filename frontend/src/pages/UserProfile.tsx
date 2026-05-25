import React, { useState } from 'react';
import { useAppSelector } from '../hooks/redux';
import { 
  User, CreditCard, Link as LinkIcon, Wallet, BookOpen, 
  Shield, Eye, FileText, Star, Award, CheckSquare, 
  ClipboardList, PenTool, Database, HelpCircle
} from 'lucide-react';

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
      <div className="flex-1 glass-panel rounded-2xl border border-white/10 p-8">
        
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-theme-neonCyan rounded-full flex items-center justify-center text-slate-900 mb-4 shadow-glow-cyan border-4 border-theme-bg">
            <User className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{user?.name || 'اسم المستخدم'}</h2>
          <div className="flex flex-col items-center text-slate-400 text-sm gap-1">
            <span dir="ltr">0123456789</span>
            <span>{user?.email || 'user@example.com'}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-12">
          <button className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-colors text-sm">
            لو معاك كود، يمكنك استخدامه عن الرصيد هنا
          </button>
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
                <span className="text-xl font-bold">29 %</span>
                <span className="text-xs">على منصة</span>
              </div>
              <span className="text-sm text-slate-300 font-semibold mb-2">عدد الفيديوهات شوفتها</span>
              <span className="text-xs bg-rose-500 text-white px-3 py-1 rounded-full">0 فيديو - من 296</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-4 border-theme-neonCyan flex flex-col items-center justify-center mb-3 text-white">
                <span className="text-xl font-bold">11 %</span>
                <span className="text-xs">من الكورسات</span>
              </div>
              <span className="text-sm text-slate-300 font-semibold mb-2">عدد الاختبارات اللي خلصتها</span>
              <span className="text-xs bg-theme-neonCyan text-slate-900 font-bold px-3 py-1 rounded-full">6 امتحانات - من 54</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-4 border-rose-500 flex flex-col items-center justify-center mb-3 text-white">
                <span className="text-xl font-bold">0 %</span>
                <span className="text-xs">بداية!</span>
              </div>
              <span className="text-sm text-slate-300 font-semibold mb-2">متوسط النتائج اللي جبتها</span>
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

      </div>
    </div>
  );
};

export default UserProfile;
