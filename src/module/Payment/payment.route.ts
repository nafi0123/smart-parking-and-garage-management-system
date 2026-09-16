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

// Cancel confirmed booking and process refund (allowed at least 1 hour before startTime)
router.post(
  '/refund/:bookingId',
  auth('DRIVER', 'MANAGER', 'ADMIN'),
  PaymentController.refundPayment,
);

// Get all payments for logged-in user
router.get('/my-payments', auth('DRIVER', 'MANAGER', 'ADMIN'), PaymentController.getMyPayments);

// Get single payment details (by payment id, transactionId, or bookingId)
router.get('/:identifier', auth('DRIVER', 'MANAGER', 'ADMIN'), PaymentController.getPaymentDetails);

export const PaymentRoutes = router;
