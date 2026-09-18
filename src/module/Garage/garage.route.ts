import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import auth from '../../app/middlewares/auth';
import validateRequest from '../../app/middlewares/validateRequest';
import { upload } from '../../app/utils/cloudinary';
import { GarageController } from './garage.controller';
import { GarageValidation } from './garage.validation';

const router = Router();

const parseFormDataBody = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body?.data && typeof req.body.data === 'string') {
    try {
      req.body = JSON.parse(req.body.data);
    } catch {
      // ignore
    }
  }
  next();
};

// Manager or Admin - Create a garage (supports multipart/form-data images or JSON)
router.post(
  '/',
  auth('MANAGER', 'ADMIN'),
  upload.array('images', 5),
  parseFormDataBody,
  validateRequest(GarageValidation.createGarageValidationSchema),
  GarageController.createGarage,
);

// Get all garages (Public / Search)
router.get('/', GarageController.getAllGarages);

// Manager or Admin - Get garages owned by logged in user
router.get('/my-garages', auth('MANAGER', 'ADMIN'), GarageController.getMyGarages);

// Get single garage details
router.get('/:id', GarageController.getSingleGarage);

// Manager or Admin - Update garage
router.patch(
  '/:id',
  auth('MANAGER', 'ADMIN'),
  upload.array('images', 5),
  parseFormDataBody,
  validateRequest(GarageValidation.updateGarageValidationSchema),
  GarageController.updateGarage,
);

// Manager or Admin - Delete garage
router.delete('/:id', auth('MANAGER', 'ADMIN'), GarageController.deleteGarage);

export const GarageRoutes = router;
