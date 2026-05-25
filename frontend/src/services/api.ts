import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { siteConfig } from '../config/siteConfig';

const api = axios.create({
  baseURL: siteConfig.api.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  // 🔒 مع withCredentials: true، المتصفح سيرسل الكوكيز (HttpOnly) تلقائياً
  withCredentials: true, 
});

// تعريف أنواع للتحكم في الطلبات المعلقة أثناء التجديد
interface FailedRequest {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

interface RefreshRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// متغيرات للتحكم في حالة التجديد (Token Refresh)
let isRefreshing = false;
let failedRequestsQueue: FailedRequest[] = [];

/**
 * دالة معالجة طابور الطلبات
 * وظيفتها: عند الانتهاء من تجديد التوكن، تقوم بتشغيل كافة الطلبات التي تم تعليقها مسبقاً
 */
const processQueue = (error: unknown) => {
  failedRequestsQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedRequestsQueue = [];
};

/**
 * المعترض (Interceptor) للاستجابات
 * وظيفته: فحص جميع الاستجابات القادمة من السيرفر. 
 * إذا انتهت صلاحية التوكن (الرد كان 401)، يقوم تلقائياً بإيقاف الطلب، ومحاولة تجديد التوكن،
 * ثم إعادة إرسال الطلب الأصلي بسلاسة دون أن يلاحظ المستخدم.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<unknown>) => {
    const originalRequest = error.config as RefreshRequestConfig;

    // منع حلقات التكرار اللانهائية لطلبات التوثيق
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 🍪 طلب تحديث التوكنز
        await api.post('/auth/refresh');

        processQueue(null);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError);
        isRefreshing = false;
        
        // إذا فشل الـ Refresh، قم بتسجيل خروج المستخدم
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;