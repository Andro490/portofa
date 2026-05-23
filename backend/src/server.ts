import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Load environment variables
dotenv.config();

import authRoutes from './routes/authRoutes';
import courseRoutes from './routes/courseRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ 1. SECURITY: Helmet Headers (في الأول دائماً)
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));

// ✅ إعدادات الـ CORS للسماح بالفرونت إند الخاص بك فقط
app.use(
  cors({
    origin: ['https://portofa.vercel.app', 'http://localhost:5173'], // إضافة رابط الموقع، و localhost للوقت التطوير
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    credentials: true, // مهم جداً لدعم الكوكيز وإرسال الـ Headers
    optionsSuccessStatus: 200
  })
);

// ✅ 3. Body Parsers & Cookies (خط الدفاع الأول لقراءة البيانات والكوكيز)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ✅ 4. Rate Limiters (دلوقتي يقدروا يقروا الطلبات بأمان ومن غير أخطاء)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true
});

// تطبيق الـ Global Limiter
app.use(limiter);

// Static route for uploads
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Cinematic Edu API is running' });
});

// ✅ 5. API Routes (بعد التأكد من ترتيب كل الـ Middlewares)
app.use('/api/auth/register', authLimiter); 
app.use('/api/auth/login', authLimiter);    
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error-handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err.message);
  res.status(500).json({
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`========================================`);
});