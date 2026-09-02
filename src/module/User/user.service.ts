import type { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import redisClient from '../../app/config/redis';
import AppError from '../../app/errors/AppError';
import prisma from '../../app/utils/prisma';
import { sendWelcomeOtpEmail } from '../../app/utils/sendEmail';
import type { IRegisterUser, IUserQueryFilter } from './user.interface';

const createUser = async (payload: IRegisterUser) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new AppError(400, 'User already exists with this email');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: hashedPassword,
      role: payload.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });

  // Generate OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP in Redis with 5 minutes (300s) TTL
  await redisClient.set(`otp:${payload.email}`, otpCode, 'EX', 300);

  // Send Email with EJS template via Resend automatically on user creation
  try {
    await sendWelcomeOtpEmail({
      to: payload.email,
      name: payload.name,
      role: payload.role,
      otpCode,
    });
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
  }

  return user;
};

const getAllUsers = async (query: IUserQueryFilter) => {
  const {
    searchTerm,
    role,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const whereConditions: Prisma.UserWhereInput[] = [];

  if (searchTerm) {
    whereConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (role) {
    whereConditions.push({
      role: role,
    });
  }

  const where: Prisma.UserWhereInput = whereConditions.length > 0 ? { AND: whereConditions } : {};

  const users = await prisma.user.findMany({
    where,
    skip,
    take: limitNum,
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.user.count({ where });
  const totalPage = Math.ceil(total / limitNum);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPage,
    },
    data: users,
  };
};

const blockUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.role === 'ADMIN') {
    throw new AppError(400, 'Cannot block an admin user');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
    },
  });

  return updatedUser;
};

export const UserService = {
  createUser,
  getAllUsers,
  blockUser,
};
