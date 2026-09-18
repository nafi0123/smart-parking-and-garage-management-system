import type { Request, Response } from 'express';
import catchAsync from '../../app/utils/catchAsync';
import sendResponse from '../../app/utils/sendResponse';
import { VehicleService } from './vehicle.service';

const createVehicle = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const result = await VehicleService.createVehicle(userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Vehicle added successfully',
    data: result,
  });
});

const getMyVehicles = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const result = await VehicleService.getMyVehicles(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My vehicles retrieved successfully',
    data: result,
  });
});

const getSingleVehicle = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.userId;
  const result = await VehicleService.getSingleVehicle(id as string, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vehicle details retrieved successfully',
    data: result,
  });
});

const updateVehicle = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.userId;
  const result = await VehicleService.updateVehicle(id as string, userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vehicle updated successfully',
    data: result,
  });
});

const deleteVehicle = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.userId;
  await VehicleService.deleteVehicle(id as string, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vehicle deleted successfully',
    data: null,
  });
});

export const VehicleController = {
  createVehicle,
  getMyVehicles,
  getSingleVehicle,
  updateVehicle,
  deleteVehicle,
};
