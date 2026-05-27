import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const protect = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // 🍪 التعديل الأمني: قراءة التوكن من الكوكيز المحمية أولاً، وإذا لم يجدها يقرأ من الهيدر التقليدي
  const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

  // لو مفيش توكن خالص لا في الكوكي ولا في الهيدر
  if (!token) {
    console.error('Auth Error: No token provided in cookies or headers');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // التحقق من صحة التوكن وصلاحيته
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    console.error('Auth Error: Invalid or expired token', token.substring(0, 10) + '...');
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  // تمرير البيانات المفكوكة (userId و role) للـ Controllers
  req.user = decoded;
  next();
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    // الأمان الحقيقي ضد تزوير الصلاحيات: التحقق من الـ role القادم من التوكن المشفر
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. You do not have permission.' });
    }

    next();
  };
};
