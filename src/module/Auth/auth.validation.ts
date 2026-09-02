import { z } from 'zod';

const loginValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }),
  }),
});

const sendOtpValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    name: z.string().optional(),
  }),
});

const verifyOtpValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    otpCode: z
      .string({ required_error: 'OTP code is required' })
      .length(6, 'OTP code must be 6 digits'),
  }),
});

export const AuthValidation = {
  loginValidationSchema,
  sendOtpValidationSchema,
  verifyOtpValidationSchema,
};
