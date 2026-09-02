import { z } from 'zod';

const createGarageValidationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Garage name is required',
    }),
    address: z.string({
      required_error: 'Address is required',
    }),
    description: z.string().optional(),
    totalSlots: z.number().int().positive().optional().default(1),
    availableSlots: z.number().int().nonnegative().optional(),
    pricePerHour: z.number().nonnegative().optional().default(0),
    location: z.string().optional(),
  }),
});

const updateGarageValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    description: z.string().optional(),
    totalSlots: z.number().int().positive().optional(),
    availableSlots: z.number().int().nonnegative().optional(),
    pricePerHour: z.number().nonnegative().optional(),
    location: z.string().optional(),
  }),
});

export const GarageValidation = {
  createGarageValidationSchema,
  updateGarageValidationSchema,
};
