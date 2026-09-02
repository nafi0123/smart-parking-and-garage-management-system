import type { Request, Response } from 'express';
import catchAsync from '../../app/utils/catchAsync';
import sendResponse from '../../app/utils/sendResponse';
import { BookingService } from './booking.service';

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const result = await BookingService.createBooking(userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Booking created successfully',
    data: result,
  });
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const result = await BookingService.getMyBookings(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My bookings retrieved successfully',
    data: result,
  });
});

const getManagerBookings = catchAsync(async (req: Request, res: Response) => {
  const managerId = (req as any).user.userId;
  const result = await BookingService.getManagerBookings(managerId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Manager garage bookings retrieved successfully',
    data: result,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingService.getAllBookings(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All bookings retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, role } = (req as any).user;
  const result = await BookingService.getSingleBooking(id as string, userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking details retrieved successfully',
    data: result,
  });
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, role } = (req as any).user;
  const result = await BookingService.cancelBooking(id as string, userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking cancelled successfully',
    data: result,
  });
});

const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, role } = (req as any).user;
  const result = await BookingService.updateBookingStatus(id as string, userId, role, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking status updated successfully',
    data: result,
  });
});

export const BookingController = {
  createBooking,
  getMyBookings,
  getManagerBookings,
  getAllBookings,
  getSingleBooking,
  cancelBooking,
  updateBookingStatus,
};
