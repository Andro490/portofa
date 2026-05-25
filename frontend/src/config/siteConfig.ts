// ==========================================
// 🌟 إعدادات الموقع الأساسية (White-label Config)
// ==========================================
// هذا الملف يحتوي على جميع المتغيرات الخاصة بالعميل.
// لتغيير اسم الموقع، الألوان الأساسية، أو الروابط لعميل جديد، 
// قم بتعديل هذا الملف فقط وسينعكس التغيير في كل مكان.

export const siteConfig = {
  // 📌 1. المعلومات الأساسية (Basic Info)
  name: "أكاديمية سينما", // اسم المنصة بالكامل
  brandPrefix: "أكاديمية", // الجزء الأول من الاسم
  brandHighlight: "سينما", // الجزء المميز بلون مختلف
  description: "منصة تعليمية متطورة لتعليم البرمجة الإبداعية وتطوير المواقع ثلاثية الأبعاد بأسلوب سينمائي مبتكر.", // وصف المنصة (يستخدم في الـ SEO)
  
  // 📌 2. معلومات التواصل (Contact Info)
  supportEmail: "support@cinematic-edu.com",
  phoneNumber: "+20 123 456 7890",
  address: "القاهرة، مصر",

  // 📌 3. روابط السوشيال ميديا (Social Media Links)
  social: {
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
    linkedin: "https://linkedin.com",
  },

  // 📌 4. إعدادات التصميم والألوان (Theme & Branding)
  // يتم استخدام هذه القيم للتحكم في الهوية البصرية (إذا كنت تستخدمها في الـ Tailwind)
  theme: {
    primaryColor: "#0ea5e9", // لون رئيسي (أزرق مثلاً)
    secondaryColor: "#10b981", // لون ثانوي (أخضر مثلاً)
    fontFamily: "'Tajawal', sans-serif", // الخط المستخدم
  },

  // 📌 5. إعدادات الميزات (Features Toggles)
  // لتفعيل أو تعطيل ميزات معينة بناءً على خطة العميل
  features: {
    enableBlog: true, // تفعيل المدونة
    enableLiveClasses: false, // تفعيل البث المباشر
    enableCertificates: true, // تفعيل الشهادات
  },

  // 📌 6. إعدادات السيرفر والـ API
  // عادة ما تكون في ملف .env ولكن يمكن وضع مسارات عامة هنا
  api: {
    baseUrl: import.meta.env.VITE_API_URL || "https://backend-production-a4c41.up.railway.app/api",
  }
};
