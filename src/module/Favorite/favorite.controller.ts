import type { Request, Response } from 'express';
import catchAsync from '../../app/utils/catchAsync';
import sendResponse from '../../app/utils/sendResponse';
import { FavoriteService } from './favorite.service';

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
  const { garageId } = req.params;
  const userId = (req as any).user.userId;
  const result = await FavoriteService.toggleFavorite(userId, garageId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result,
  });
});

const getMyFavorites = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const result = await FavoriteService.getMyFavorites(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Favorite garages retrieved successfully',
    data: result,
  });
});

const checkIsFavorite = catchAsync(async (req: Request, res: Response) => {
  const { garageId } = req.params;
  const userId = (req as any).user.userId;
  const result = await FavoriteService.checkIsFavorite(userId, garageId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Favorite status retrieved',
    data: result,
  });
});

export const FavoriteController = {
  toggleFavorite,
  getMyFavorites,
  checkIsFavorite,
};
