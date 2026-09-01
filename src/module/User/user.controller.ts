import { Request, Response } from 'express';
import catchAsync from '../../app/utils/catchAsync';
import sendResponse from '../../app/utils/sendResponse';
import { UserService } from './user.service';

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const blockUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await UserService.blockUser(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.isActive
      ? 'User unblocked successfully'
      : 'User blocked successfully',
    data: result,
  });
});

export const UserController = {
  createUser,
  blockUser,
};
