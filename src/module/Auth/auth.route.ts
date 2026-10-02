import { Router } from 'express';
import validateRequest from '../../app/middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = Router();

router.post('/login', validateRequest(AuthValidation.loginValidationSchema), AuthController.login);

router.post(
  '/google-login',
  validateRequest(AuthValidation.googleLoginValidationSchema),
  AuthController.googleLogin,
);

// Google redirect handler - receives POST from Google with credential in form body
// No validation middleware since Google sends urlencoded form data, not JSON
router.post('/google-redirect', AuthController.googleRedirect);
router.get('/google-redirect', AuthController.googleRedirect);

router.post(
  '/verify-otp',
  validateRequest(AuthValidation.verifyOtpValidationSchema),
  AuthController.verifyOtp,
);

router.post('/logout', AuthController.logout);

export const AuthRoutes = router;
