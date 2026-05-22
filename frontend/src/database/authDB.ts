import { initDB } from './indexedDB';

// ✅ SECURITY: Simple encoding for tokens (use proper encryption in production!)
// In production, use: crypto-js, tweetnacl, or libsodium
const encodeToken = (token: string): string => {
  try {
    return btoa(token); // base64 encode for basic obfuscation
  } catch (e) {
    return token;
  }
};

const decodeToken = (encoded: string): string => {
  try {
    return atob(encoded); // base64 decode
  } catch (e) {
    return encoded;
  }
};

export const authDB = {
  async setToken(key: 'accessToken' | 'refreshToken', token: string) {
    const db = await initDB();
    // ✅ Encode token before storing
    const encodedToken = encodeToken(token);
    await db.put('auth', { key, value: encodedToken });
  },

  async getToken(key: 'accessToken' | 'refreshToken'): Promise<string | null> {
    const db = await initDB();
    const result = await db.get('auth', key);
    if (result) {
      // ✅ Decode token when retrieving
      return decodeToken(result.value);
    }
    return null;
  },

  async removeToken(key: 'accessToken' | 'refreshToken') {
    const db = await initDB();
    await db.delete('auth', key);
  },

  async clearAuth() {
    const db = await initDB();
    await db.clear('auth');
  }
};
