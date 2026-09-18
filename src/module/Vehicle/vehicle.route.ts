import { Router } from 'express';
import auth from '../../app/middlewares/auth';
import validateRequest from '../../app/middlewares/validateRequest';
import { VehicleController } from './vehicle.controller';
import { VehicleValidation } from './vehicle.validation';

const router = Router();

// Add a new vehicle (Driver, Manager, Admin)
router.post(
  '/',
  auth('DRIVER', 'MANAGER', 'ADMIN'),
  validateRequest(VehicleValidation.createVehicleValidationSchema),
  VehicleController.createVehicle,
);

// Get my saved vehicles
router.get('/my-vehicles', auth('DRIVER', 'MANAGER', 'ADMIN'), VehicleController.getMyVehicles);

// Get single vehicle
router.get('/:id', auth('DRIVER', 'MANAGER', 'ADMIN'), VehicleController.getSingleVehicle);

// Update vehicle
router.patch(
  '/:id',
  auth('DRIVER', 'MANAGER', 'ADMIN'),
  validateRequest(VehicleValidation.updateVehicleValidationSchema),
  VehicleController.updateVehicle,
);

// Delete vehicle
router.delete('/:id', auth('DRIVER', 'MANAGER', 'ADMIN'), VehicleController.deleteVehicle);

export const VehicleRoutes = router;
