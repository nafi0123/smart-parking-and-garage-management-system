import { Router } from 'express';
import { GarageController } from './garage.controller';
import validateRequest from '../../app/middlewares/validateRequest';
import { GarageValidation } from './garage.validation';
import auth from '../../app/middlewares/auth';

const router = Router();

// Manager or Admin - Create a garage
router.post(
  '/',
  auth('MANAGER', 'ADMIN'),
  validateRequest(GarageValidation.createGarageValidationSchema),
  GarageController.createGarage,
);

// Get all garages (Public / Search)
router.get(
  '/',
  GarageController.getAllGarages,
);

// Manager or Admin - Get garages owned by logged in user
router.get(
  '/my-garages',
  auth('MANAGER', 'ADMIN'),
  GarageController.getMyGarages,
);

// Get single garage details
router.get(
  '/:id',
  GarageController.getSingleGarage,
);

// Manager or Admin - Update garage
router.patch(
  '/:id',
  auth('MANAGER', 'ADMIN'),
  validateRequest(GarageValidation.updateGarageValidationSchema),
  GarageController.updateGarage,
);

// Manager or Admin - Delete garage
router.delete(
  '/:id',
  auth('MANAGER', 'ADMIN'),
  GarageController.deleteGarage,
);

export const GarageRoutes = router;
