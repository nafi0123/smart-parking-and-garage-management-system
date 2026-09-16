import { Router } from 'express';
import auth from '../../app/middlewares/auth';
import { PaymentController } from './payment.controller';

const router = Router();

// SSLCommerz public callbacks (POST method as required by SSLCommerz)
router.post('/confirm', PaymentController.confirmPayment);
router.post('/fail', PaymentController.failPayment);
router.post('/cancel', PaymentController.cancelPayment);

// Re-initiate payment for an existing unpaid booking
router.post(
  '/initiate/:bookingId',
  auth('DRIVER', 'MANAGER', 'ADMIN'),
  PaymentController.initiatePayment,
);

export const PaymentRoutes = router;
