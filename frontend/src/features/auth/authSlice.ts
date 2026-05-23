import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { authDB } from '../../database/authDB';
import { clearDatabase } from '../../database/indexedDB';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  isInitialized: false,
};

// Async Thunks
// ✅ ملاحظة: الـ Backend يحفظ التوكنز في httpOnly cookies تلقائياً
// فلا حاجة لاستخراجهم من الـ response body أو تخزينهم في IndexedDB
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user } = response.data;
      // نسجل علامة بسيطة في IndexedDB أن المستخدم مسجل دخول (للاستفادة منها في loadMe)
      await authDB.setToken('accessToken', 'cookie-based');
      return user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشلت عملية التسجيل');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', userData);
      const { user } = response.data;
      // نسجل علامة بسيطة في IndexedDB أن المستخدم مسجل دخول (للاستفادة منها في loadMe)
      await authDB.setToken('accessToken', 'cookie-based');
      return user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    // ✅ استدعاء endpoint الـ logout في الباك إند لمسح الكوكيز المحمية
    try {
      await api.post('/auth/logout');
    } catch {
      // حتى لو فشل الطلب، نمسح البيانات المحلية
    }
    await clearDatabase();
    return true;
  }
);

export const loadMe = createAsyncThunk(
  'auth/loadMe',
  async (_, { rejectWithValue }) => {
    try {
      const token = await authDB.getToken('accessToken');
      if (!token) return rejectWithValue('No token found');
      
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      await authDB.clearAuth();
      return rejectWithValue(error.response?.data?.message || 'انتهت الجلسة');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Logout User
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      // Load Me
      .addCase(loadMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadMe.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isInitialized = true;
      })
      .addCase(loadMe.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        if (action.payload !== 'No token found') {
          state.error = action.payload as string;
        }
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
