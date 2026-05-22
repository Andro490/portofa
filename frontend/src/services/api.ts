import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 🔒 السطر السحري: بيخلي المتصفح يبعت ويستقبل كوكيز الـ HttpOnly أوتوماتيكياً
});

// 💡 ملاحظة: مسحنا الـ Request Interceptor القديم لأنه مبقاش ليه لزمة! 
// المتصفح هيبعت الـ accessToken لوحده جوة الكوكي مع كل طلب بأمان كامل.

interface FailedRequest {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

interface RefreshRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Response Interceptor: Handle Token Refresh on 401
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

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<unknown>) => {
    const originalRequest = error.config as RefreshRequestConfig;

    // منع الـ Infinite loops إذا فشل طلب الـ refresh نفسه أو لو كنا في صفحات الدخول
    if (
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then(() => {
            // الكوكيز الجديدة تم تعيينها تلقائياً، فقط نعيد الطلب
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 🍪 بنطلب تحديث التوكن، والباك إند هيقرا الـ refreshToken من الكوكي ويحدث الـ accessToken في كوكي تانية تلقائياً
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });

        processQueue(null);
        isRefreshing = false;

        // إعادة تنفيذ الطلب الأصلي بعد تحديث الكوكيز بنجاح
        return api(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError);
        isRefreshing = false;
        
        // لو الـ Refresh Token كمان باظ أو انتهى، بنعمل Logout للمستخدم فوراً
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;