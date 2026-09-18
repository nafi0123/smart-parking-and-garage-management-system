import { z } from 'zod';

const createVehicleValidationSchema = z.object({
  body: z.object({
    vehicleNumber: z.string({
      required_error: 'Vehicle number (License plate) is required',
    }),
    vehicleType: z.enum(['CAR', 'BIKE', 'SUV', 'TRUCK', 'VAN']).optional().default('CAR'),
    model: z.string().optional(),
    color: z.string().optional(),
    isDefault: z.boolean().optional().default(false),
  }),
});

const updateVehicleValidationSchema = z.object({
  body: z.object({
    vehicleNumber: z.string().optional(),
    vehicleType: z.enum(['CAR', 'BIKE', 'SUV', 'TRUCK', 'VAN']).optional(),
    model: z.string().optional(),
    color: z.string().optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const VehicleValidation = {
  createVehicleValidationSchema,
  updateVehicleValidationSchema,
};
