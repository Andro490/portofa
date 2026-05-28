import express from 'express';
import { savePaymentSettings, getPaymentSettings, handlePurchase } from '../controllers/paymentController';
import { protect, authorize } from '../middleware/auth';

const admin = authorize('ADMIN');

const router = express.Router();

// Admin routes for managing payment gateways
router.post('/settings', protect, admin, savePaymentSettings);
router.get('/settings', protect, admin, getPaymentSettings);

// User route for initializing purchase
router.post('/purchase', protect, handlePurchase);

export default router;
