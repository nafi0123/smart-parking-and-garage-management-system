import type { Request, Response } from 'express';
import catchAsync from '../../app/utils/catchAsync';
import sendResponse from '../../app/utils/sendResponse';
import { AnalyticsService } from './analytics.service';

const getManagerAnalytics = catchAsync(async (req: Request, res: Response) => {
  const managerId = (req as any).user.userId;
  const result = await AnalyticsService.getManagerAnalytics(managerId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Manager analytics retrieved successfully',
    data: result,
  });
});

const getAdminAnalytics = catchAsync(async (_req: Request, res: Response) => {
  const result = await AnalyticsService.getAdminAnalytics();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin platform analytics retrieved successfully',
    data: result,
  });
});

export const AnalyticsController = {
  getManagerAnalytics,
  getAdminAnalytics,
};
