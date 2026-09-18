import type { Request, Response } from 'express';
import catchAsync from '../../app/utils/catchAsync';
import { uploadMultipleToCloudinary } from '../../app/utils/cloudinary';
import sendResponse from '../../app/utils/sendResponse';
import { GarageService } from './garage.service';

const createGarage = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  let body = req.body;

  if (typeof req.body?.data === 'string') {
    try {
      body = JSON.parse(req.body.data);
    } catch {
      // continue with req.body
    }
  }

  const uploadedImages: string[] = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const urls = await uploadMultipleToCloudinary(req.files as Express.Multer.File[]);
    uploadedImages.push(...urls);
  } else if (req.file) {
    const urls = await uploadMultipleToCloudinary([req.file as Express.Multer.File]);
    uploadedImages.push(...urls);
  }

  const bodyImages = Array.isArray(body.images) ? body.images : body.images ? [body.images] : [];
  body.images = [...bodyImages, ...uploadedImages];

  const result = await GarageService.createGarage(userId, body);

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
  let body = req.body;

  if (typeof req.body?.data === 'string') {
    try {
      body = JSON.parse(req.body.data);
    } catch {
      // continue with req.body
    }
  }

  const uploadedImages: string[] = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const urls = await uploadMultipleToCloudinary(req.files as Express.Multer.File[]);
    uploadedImages.push(...urls);
  } else if (req.file) {
    const urls = await uploadMultipleToCloudinary([req.file as Express.Multer.File]);
    uploadedImages.push(...urls);
  }

  if (uploadedImages.length > 0) {
    const bodyImages = Array.isArray(body.images) ? body.images : body.images ? [body.images] : [];
    body.images = [...bodyImages, ...uploadedImages];
  }

  const result = await GarageService.updateGarage(id as string, userId, role, body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Garage updated successfully',
    data: result,
  });
});

const getNearbyGarages = catchAsync(async (req: Request, res: Response) => {
  const result = await GarageService.getNearbyGarages(req.query as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Nearby garages retrieved successfully',
    meta: result.meta,
    data: result.data,
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
  getNearbyGarages,
  getMyGarages,
  getSingleGarage,
  updateGarage,
  deleteGarage,
};
