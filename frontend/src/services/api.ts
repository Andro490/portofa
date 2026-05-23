import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

// إعداد عنوان الـ API (استخدام بيئة Vercel أو الرابط المباشر لـ Railway)
const API_URL = import.meta.env.VITE_API_URL || 'https://backend-production-a4c41.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
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

// Response Interceptor: لمعالجة انتهاء التوكن (401) وتجديده
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