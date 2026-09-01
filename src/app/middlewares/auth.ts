import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from '../utils/prisma';
import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';

const auth = (...requiredRoles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    if (!token) {
      throw new AppError(401, 'You are not authorized!');
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET as string,
      ) as JwtPayload;
    } catch (err) {
      throw new AppError(401, 'Token is invalid or expired!');
    }

    const { userId, role } = decoded;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found!');
    }

    // Check if user is blocked
    if (!user.isActive) {
      throw new AppError(403, 'Your account has been blocked!');
    }

    // Check if user account is verified
    if (!user.isVerified) {
      throw new AppError(403, 'Please verify your account first!');
    }

    // Check role authorization
    if (requiredRoles.length && !requiredRoles.includes(role)) {
      throw new AppError(403, 'You are not authorized to access this resource!');
    }

    // Attach user info to request
    (req as any).user = decoded;

    next();
  });
};

export default auth;
