import type { Request, Response } from 'express';
import catchAsync from '../../app/utils/catchAsync';
import sendResponse from '../../app/utils/sendResponse';
import { AuthService } from './auth.service';

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);

  // Set access token cookie
  res.cookie('accessToken', result.accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Login successful',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.googleLogin(req.body);

  // Set access token cookie
  res.cookie('accessToken', result.accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Google login successful',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.verifyOtp(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'OTP verified successfully',
    data: result,
  });
});

const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie('accessToken', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
});

export const AuthController = {
  login,
  googleLogin,
  verifyOtp,
  logout,
};
