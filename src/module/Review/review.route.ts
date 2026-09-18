import { Router } from 'express';
import auth from '../../app/middlewares/auth';
import validateRequest from '../../app/middlewares/validateRequest';
import { ReviewController } from './review.controller';
import { ReviewValidation } from './review.validation';

const router = Router();

// Submit a review for a completed booking
router.post(
  '/',
  auth('DRIVER', 'MANAGER', 'ADMIN'),
  validateRequest(ReviewValidation.createReviewValidationSchema),
  ReviewController.createReview,
);

// Get my reviews
router.get('/my-reviews', auth('DRIVER', 'MANAGER', 'ADMIN'), ReviewController.getMyReviews);

// Get all reviews for a specific garage (Public)
router.get('/garage/:garageId', ReviewController.getGarageReviews);

// Update review
router.patch(
  '/:id',
  auth('DRIVER', 'MANAGER', 'ADMIN'),
  validateRequest(ReviewValidation.updateReviewValidationSchema),
  ReviewController.updateReview,
);

// Delete review
router.delete('/:id', auth('DRIVER', 'MANAGER', 'ADMIN'), ReviewController.deleteReview);

export const ReviewRoutes = router;
