import { z } from 'zod';

const createReviewValidationSchema = z.object({
  body: z.object({
    bookingId: z.string({
      required_error: 'Booking ID is required',
    }),
    rating: z
      .number({
        required_error: 'Rating is required',
      })
      .int()
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5'),
    comment: z.string().optional(),
  }),
});

const updateReviewValidationSchema = z.object({
  body: z.object({
    rating: z
      .number()
      .int()
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5')
      .optional(),
    comment: z.string().optional(),
  }),
});

export const ReviewValidation = {
  createReviewValidationSchema,
  updateReviewValidationSchema,
};
