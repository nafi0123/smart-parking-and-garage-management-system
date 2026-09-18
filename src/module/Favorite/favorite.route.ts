import { Router } from 'express';
import auth from '../../app/middlewares/auth';
import { FavoriteController } from './favorite.controller';

const router = Router();

// Toggle favorite garage (add/remove)
router.post('/:garageId', auth('DRIVER', 'MANAGER', 'ADMIN'), FavoriteController.toggleFavorite);

// Get my favorite garages
router.get('/my-favorites', auth('DRIVER', 'MANAGER', 'ADMIN'), FavoriteController.getMyFavorites);

// Check if specific garage is favorited
router.get(
  '/check/:garageId',
  auth('DRIVER', 'MANAGER', 'ADMIN'),
  FavoriteController.checkIsFavorite,
);

export const FavoriteRoutes = router;
