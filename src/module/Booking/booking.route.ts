import { Router } from 'express';
import auth from '../../app/middlewares/auth';
import validateRequest from '../../app/middlewares/validateRequest';
import { BookingController } from './booking.controller';
import { BookingValidation } from './booking.validation';

const router = Router();

// Create a slot booking (Drivers, Managers, Admins)
router.post(
  '/',
  auth('DRIVER', 'MANAGER', 'ADMIN'),
  validateRequest(BookingValidation.createBookingValidationSchema),
  BookingController.createBooking,
);

// Get bookings created by logged in user (Driver view)
router.get('/my-bookings', auth('DRIVER', 'MANAGER', 'ADMIN'), BookingController.getMyBookings);

// Get bookings for garages owned by logged in manager (Manager view)
router.get('/manager-bookings', auth('MANAGER', 'ADMIN'), BookingController.getManagerBookings);

// Get all bookings (Admin only)
router.get('/', auth('ADMIN'), BookingController.getAllBookings);

// Get single booking details
router.get('/:id', auth('DRIVER', 'MANAGER', 'ADMIN'), BookingController.getSingleBooking);

// Download/View PDF Invoice for booking
router.get('/:id/invoice', auth('DRIVER', 'MANAGER', 'ADMIN'), BookingController.getBookingInvoice);

// Cancel a booking
router.patch('/:id/cancel', auth('DRIVER', 'MANAGER', 'ADMIN'), BookingController.cancelBooking);

// Update booking status (Manager/Admin)
router.patch(
  '/:id/status',
  auth('MANAGER', 'ADMIN'),
  validateRequest(BookingValidation.updateBookingStatusValidationSchema),
  BookingController.updateBookingStatus,
);

export const BookingRoutes = router;
