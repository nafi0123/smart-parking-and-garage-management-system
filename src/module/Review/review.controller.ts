import type { Request, Response } from 'express';
import catchAsync from '../../app/utils/catchAsync';
import sendResponse from '../../app/utils/sendResponse';
import { ReviewService } from './review.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const result = await ReviewService.createReview(userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Review submitted successfully',
    data: result,
  });
});

const getGarageReviews = catchAsync(async (req: Request, res: Response) => {
  const { garageId } = req.params;
  const result = await ReviewService.getGarageReviews(garageId as string, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Garage reviews retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const result = await ReviewService.getMyReviews(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My reviews retrieved successfully',
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.userId;
  const result = await ReviewService.updateReview(id as string, userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review updated successfully',
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, role } = (req as any).user;
  await ReviewService.deleteReview(id as string, userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review deleted successfully',
    data: null,
  });
});

export const ReviewController = {
  createReview,
  getGarageReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
