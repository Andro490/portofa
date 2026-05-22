import { Router } from 'express';
import { getStudentDashboard, getAdminStats } from '../controllers/dashboardController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/student', protect as any, getStudentDashboard as any);
router.get('/admin', protect as any, authorize('ADMIN') as any, getAdminStats as any);

export default router;
