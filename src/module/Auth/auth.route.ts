import { Router } from 'express';
import { AuthController } from './auth.controller';
import validateRequest from '../../app/middlewares/validateRequest';
import { AuthValidation } from './auth.validation';

const router = Router();

router.post(
  '/login',
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login,
);

export const AuthRoutes = router;
