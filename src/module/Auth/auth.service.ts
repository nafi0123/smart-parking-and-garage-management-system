import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../app/utils/prisma';
import AppError from '../../app/errors/AppError';
import { ILoginUser } from './auth.interface';

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
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' },
  );

  const refreshToken = jwt.sign(
    jwtPayload,
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' },
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export const AuthService = {
  login,
};
