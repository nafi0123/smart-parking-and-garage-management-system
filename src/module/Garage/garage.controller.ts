import { Request, Response } from 'express';
import catchAsync from '../../app/utils/catchAsync';
import sendResponse from '../../app/utils/sendResponse';
import { GarageService } from './garage.service';

const createGarage = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const result = await GarageService.createGarage(userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Garage created successfully',
    data: result,
  });
});

const getAllGarages = catchAsync(async (req: Request, res: Response) => {
  const result = await GarageService.getAllGarages(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Garages retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getMyGarages = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const result = await GarageService.getMyGarages(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My garages retrieved successfully',
    data: result,
  });
});

const getSingleGarage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GarageService.getSingleGarage(id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Garage details retrieved successfully',
    data: result,
  });
});

const updateGarage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, role } = (req as any).user;
  const result = await GarageService.updateGarage(id as string, userId, role, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Garage updated successfully',
    data: result,
  });
});

const deleteGarage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, role } = (req as any).user;
  await GarageService.deleteGarage(id as string, userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Garage deleted successfully',
    data: null,
  });
});

export const GarageController = {
  createGarage,
  getAllGarages,
  getMyGarages,
  getSingleGarage,
  updateGarage,
  deleteGarage,
};
