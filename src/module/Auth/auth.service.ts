import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { type LoginTicket, OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import redisClient from '../../app/config/redis';
import AppError from '../../app/errors/AppError';
import prisma from '../../app/utils/prisma';
import type { IGoogleLogin, ILoginUser, IVerifyOtp } from './auth.interface';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

  if (!user.password) {
    throw new AppError(
      400,
      'This account was registered via Google Login. Please log in with Google.',
    );
  }

  const isPasswordMatch = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordMatch) {
    throw new AppError(401, 'Incorrect password');
  }

  if (!user.isVerified) {
    throw new AppError(403, 'Please verify your account first');
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(jwtPayload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
  });

  const refreshToken = jwt.sign(jwtPayload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      picture: user.picture,
      isVerified: user.isVerified,
    },
  };
};

const googleLogin = async (payload: IGoogleLogin) => {
  const { idToken } = payload;
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new AppError(500, 'GOOGLE_CLIENT_ID is not configured in environment!');
  }

  let ticket: LoginTicket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientId,
    });
  } catch (error: any) {
    throw new AppError(401, `Invalid or expired Google ID token: ${error.message}`);
  }

  const googlePayload = ticket.getPayload();
  if (!googlePayload?.email) {
    throw new AppError(400, 'Google token did not provide a valid email!');
  }

  const { email, name, picture } = googlePayload;

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    if (!user.isActive) {
      throw new AppError(403, 'Your account has been deactivated');
    }

    // Auto-verify user and update picture if not set
    if (!user.isVerified || (!user.picture && picture)) {
      user = await prisma.user.update({
        where: { email },
        data: {
          isVerified: true,
          picture: user.picture || picture,
        },
      });
    }
  } else {
    // Create new user with Google OAuth details
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        picture,
        isVerified: true,
        role: Role.DRIVER,
      },
    });
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(jwtPayload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
  });

  const refreshToken = jwt.sign(jwtPayload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      picture: user.picture,
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
  googleLogin,
  verifyOtp,
};
