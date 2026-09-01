import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../app/utils/prisma';
import redisClient from '../../app/config/redis';
import AppError from '../../app/errors/AppError';
import { ILoginUser, IVerifyOtp } from './auth.interface';

const login = async (payload: ILoginUser) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (!user.isActive) {
    throw new AppError(403, 'Your account has been deactivated');
  }

  const isPasswordMatch = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordMatch) {
    throw new AppError(401, 'Incorrect password');
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(
    jwtPayload,
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any },
  );

  const refreshToken = jwt.sign(
    jwtPayload,
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any },
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  };
};

const verifyOtp = async (payload: IVerifyOtp) => {
  const cachedOtp = await redisClient.get(`otp:${payload.email}`);

  if (!cachedOtp) {
    throw new AppError(400, 'OTP code has expired or does not exist');
  }

  if (cachedOtp !== payload.otpCode) {
    throw new AppError(400, 'Invalid OTP code');
  }

  // Update isVerified to true in Database
  const updatedUser = await prisma.user.update({
    where: { email: payload.email },
    data: { isVerified: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
    },
  });

  // Clear OTP from Redis after verification
  await redisClient.del(`otp:${payload.email}`);

  return {
    user: updatedUser,
    verified: true,
  };
};

export const AuthService = {
  login,
  verifyOtp,
};
