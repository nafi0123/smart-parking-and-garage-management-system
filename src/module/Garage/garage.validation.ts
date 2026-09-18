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
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
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
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    images: z.array(z.string()).optional(),
  }),
});

const nearbyGarageQueryValidationSchema = z.object({
  query: z.object({
    latitude: z.coerce.number({
      required_error: 'latitude is required for nearby search',
    }),
    longitude: z.coerce.number({
      required_error: 'longitude is required for nearby search',
    }),
    radius: z.coerce.number().positive().optional().default(10),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    onlyAvailable: z.union([z.boolean(), z.string()]).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    limit: z.coerce.number().positive().optional().default(10),
  }),
});

export const GarageValidation = {
  createGarageValidationSchema,
  updateGarageValidationSchema,
  nearbyGarageQueryValidationSchema,
};
