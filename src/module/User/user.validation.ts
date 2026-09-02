import { z } from 'zod';

const registerValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    phone: z.string().optional(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    role: z.enum(['DRIVER', 'MANAGER', 'ADMIN'], {
      required_error: 'Role is required',
      invalid_type_error: 'Role must be DRIVER, MANAGER, or ADMIN',
    }),
  }),
});

export const UserValidation = {
  registerValidationSchema,
};
