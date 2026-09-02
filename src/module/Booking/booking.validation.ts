import { BookingStatus } from '@prisma/client';
import { z } from 'zod';

const createBookingValidationSchema = z.object({
  body: z.object({
    garageId: z.string({
      required_error: 'Garage ID is required',
    }),
    startTime: z.string({
      required_error: 'Start time is required',
    }),
    endTime: z.string({
      required_error: 'End time is required',
    }),
    vehicleNumber: z.string().optional(),
  }),
});

const updateBookingStatusValidationSchema = z.object({
  body: z.object({
    status: z.nativeEnum(BookingStatus, {
      required_error: 'Status is required',
    }),
  }),
});

export const BookingValidation = {
  createBookingValidationSchema,
  updateBookingStatusValidationSchema,
};
