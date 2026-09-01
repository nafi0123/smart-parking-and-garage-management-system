import { Router } from 'express';
import { UserController } from './user.controller';
import validateRequest from '../../app/middlewares/validateRequest';
import { UserValidation } from './user.validation';
import auth from '../../app/middlewares/auth';

const router = Router();

router.post(
  '/create-user',
  validateRequest(UserValidation.registerValidationSchema),
  UserController.createUser,
);

// Admin only - block/unblock a user
router.patch(
  '/block/:userId',
  auth('ADMIN'),
  UserController.blockUser,
);

export const UserRoutes = router;
