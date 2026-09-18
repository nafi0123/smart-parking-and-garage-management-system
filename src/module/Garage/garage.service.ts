import type { Prisma } from '@prisma/client';
import AppError from '../../app/errors/AppError';
import prisma from '../../app/utils/prisma';
import type { ICreateGarage, IGarageQueryFilter, IUpdateGarage } from './garage.interface';

const createGarage = async (ownerId: string, payload: ICreateGarage) => {
  // Check if owner exists
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
  });

  if (!owner) {
    throw new AppError(404, 'Owner user not found!');
  }

  const garage = await prisma.garage.create({
    data: {
      name: payload.name,
      address: payload.address,
      description: payload.description,
      totalSlots: payload.totalSlots || 1,
      availableSlots:
        payload.availableSlots !== undefined ? payload.availableSlots : payload.totalSlots || 1,
      pricePerHour: payload.pricePerHour || 0,
      location: payload.location,
      images: payload.images || [],
      ownerId,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },
    },
  });

  return garage;
};

const getAllGarages = async (query: IGarageQueryFilter) => {
  const {
    searchTerm,
    minPrice,
    maxPrice,
    onlyAvailable,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const whereConditions: Prisma.GarageWhereInput[] = [];

  if (searchTerm) {
    whereConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { address: { contains: searchTerm, mode: 'insensitive' } },
        { location: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (minPrice !== undefined) {
    whereConditions.push({
      pricePerHour: { gte: Number(minPrice) },
    });
  }

  if (maxPrice !== undefined) {
    whereConditions.push({
      pricePerHour: { lte: Number(maxPrice) },
    });
  }

  if (onlyAvailable === true || onlyAvailable === 'true') {
    whereConditions.push({
      availableSlots: { gt: 0 },
    });
  }

  const where: Prisma.GarageWhereInput = whereConditions.length > 0 ? { AND: whereConditions } : {};

  const garages = await prisma.garage.findMany({
    where,
    skip,
    take: limitNum,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  const total = await prisma.garage.count({ where });
  const totalPage = Math.ceil(total / limitNum);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPage,
    },
    data: garages,
  };
};

const getMyGarages = async (ownerId: string) => {
  const garages = await prisma.garage.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });

  return garages;
};

const getSingleGarage = async (garageId: string) => {
  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!garage) {
    throw new AppError(404, 'Garage not found!');
  }

  return garage;
};

const updateGarage = async (
  garageId: string,
  userId: string,
  userRole: string,
  payload: IUpdateGarage,
) => {
  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
  });

  if (!garage) {
    throw new AppError(404, 'Garage not found!');
  }

  // Only the owner or an admin can update the garage
  if (garage.ownerId !== userId && userRole !== 'ADMIN') {
    throw new AppError(403, 'You are not authorized to update this garage!');
  }

  const updatedGarage = await prisma.garage.update({
    where: { id: garageId },
    data: payload,
  });

  return updatedGarage;
};

const deleteGarage = async (garageId: string, userId: string, userRole: string) => {
  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
  });

  if (!garage) {
    throw new AppError(404, 'Garage not found!');
  }

  // Only the owner or an admin can delete the garage
  if (garage.ownerId !== userId && userRole !== 'ADMIN') {
    throw new AppError(403, 'You are not authorized to delete this garage!');
  }

  await prisma.garage.delete({
    where: { id: garageId },
  });

  return null;
};

export const GarageService = {
  createGarage,
  getAllGarages,
  getMyGarages,
  getSingleGarage,
  updateGarage,
  deleteGarage,
};
