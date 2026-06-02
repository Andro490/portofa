// ==========================================
// 🌟 إعدادات الموقع الأساسية (White-label Config)
// ==========================================
// هذا الملف يحتوي على جميع المتغيرات الخاصة بالعميل.
// لتغيير اسم الموقع، الألوان الأساسية، أو الروابط لعميل جديد، 
// قم بتعديل هذا الملف فقط وسينعكس التغيير في كل مكان.

export const siteConfig = {
  // 📌 1. المعلومات الأساسية (Basic Info)
  name: "Learning platform", // اسم المنصة بالكامل
  brandPrefix: "Learning", // الجزء الأول من الاسم
  brandHighlight: "platform", // الجزء المميز بلون مختلف
  description: "An educational platform for learning programming at the highest level.", // وصف المنصة (يستخدم في الـ SEO)
  
  // 📌 2. معلومات التواصل (Contact Info)
  supportEmail: "emelnasr@gmail.com",
  phoneNumber: "+20 1144231586",
  address: "Egypt",

  // 📌 3. روابط السوشيال ميديا (Social Media Links)
  social: {
    facebook: "https://www.facebook.com/profile.php?id=100048978941379&locale=ar_AR",
    instagram: "https://www.instagram.com/androo_emil/",
    youtube: "https://www.youtube.com/@AndroEmil",
    linkedin: "https://www.linkedin.com/in/andro-emil/",
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
