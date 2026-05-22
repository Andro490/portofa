import { initDB } from './indexedDB';

export const authDB = {
  async setToken(key: 'accessToken' | 'refreshToken', token: string) {
    const db = await initDB();
    await db.put('auth', { key, value: token });
  },

  async getToken(key: 'accessToken' | 'refreshToken'): Promise<string | null> {
    const db = await initDB();
    const result = await db.get('auth', key);
    return result ? result.value : null;
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
