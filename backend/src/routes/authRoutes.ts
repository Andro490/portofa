import { Router } from 'express';
import { register, login, refresh, getMe, seedAdmin } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', protect as any, getMe as any);
router.post('/seed-admin', seedAdmin);

export default router;
