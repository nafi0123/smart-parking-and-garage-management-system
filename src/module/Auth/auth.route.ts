import { Router } from 'express';
import validateRequest from '../../app/middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = Router();

router.post('/login', validateRequest(AuthValidation.loginValidationSchema), AuthController.login);

router.post(
  '/verify-otp',
  validateRequest(AuthValidation.verifyOtpValidationSchema),
  AuthController.verifyOtp,
);

export const AuthRoutes = router;
