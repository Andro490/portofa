import { Router } from 'express';
import { getStudentDashboard, getAdminStats, getLeaderboard, deleteAllStudents } from '../controllers/dashboardController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/student', protect as any, getStudentDashboard as any);
router.get('/admin', protect as any, authorize('ADMIN') as any, getAdminStats as any);
router.delete('/admin/students', protect as any, authorize('ADMIN') as any, deleteAllStudents as any);
router.get('/leaderboard', protect as any, getLeaderboard as any);

export default router;
