import { Router } from 'express';
import auth from '../../app/middlewares/auth';
import { AnalyticsController } from './analytics.controller';

const router = Router();

// Manager Analytics Dashboard (Manager & Admin)
router.get('/manager', auth('MANAGER', 'ADMIN'), AnalyticsController.getManagerAnalytics);

// Super Admin Platform Analytics Dashboard (Admin only)
router.get('/admin', auth('ADMIN'), AnalyticsController.getAdminAnalytics);

export const AnalyticsRoutes = router;
