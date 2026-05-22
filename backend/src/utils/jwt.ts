import jwt from 'jsonwebtoken';

// ✅ SECURITY: Use environment variables without weak defaults
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// ✅ Validate that secrets are set
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('⚠️ CRITICAL: JWT_SECRET must be set and at least 32 characters long in .env');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is not properly configured. Server cannot start.');
  }
}

if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
  console.error('⚠️ CRITICAL: JWT_REFRESH_SECRET must be set and at least 32 characters long in .env');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_REFRESH_SECRET is not properly configured. Server cannot start.');
  }
}

interface TokenPayload {
  userId: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET!, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET!) as TokenPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET!) as TokenPayload;
  } catch (error) {
    return null;
  }
};
