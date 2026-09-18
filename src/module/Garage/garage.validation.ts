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
    totalSlots: z.coerce.number().int().positive().optional().default(1),
    availableSlots: z.coerce.number().int().nonnegative().optional(),
    pricePerHour: z.coerce.number().nonnegative().optional().default(0),
    location: z.string().optional(),
    images: z.array(z.string()).optional(),
  }),
});

const updateGarageValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    description: z.string().optional(),
    totalSlots: z.coerce.number().int().positive().optional(),
    availableSlots: z.coerce.number().int().nonnegative().optional(),
    pricePerHour: z.coerce.number().nonnegative().optional(),
    location: z.string().optional(),
    images: z.array(z.string()).optional(),
  }),
});

export const GarageValidation = {
  createGarageValidationSchema,
  updateGarageValidationSchema,
};
