import { Router } from 'express';
import auth from '../../app/middlewares/auth';
import validateRequest from '../../app/middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

const router = Router();

router.post(
  '/create-user',
  validateRequest(UserValidation.registerValidationSchema),
  UserController.createUser,
);

// Admin only - get all users with search, role filter, pagination
router.get('/', auth('ADMIN'), UserController.getAllUsers);

// Admin only - block/unblock a user
router.patch('/block/:userId', auth('ADMIN'), UserController.blockUser);

export const UserRoutes = router;
