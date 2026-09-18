import type { Prisma } from '@prisma/client';
import AppError from '../../app/errors/AppError';
import prisma from '../../app/utils/prisma';
import type {
  ICreateGarage,
  IGarageQueryFilter,
  INearbyGarageQuery,
  IUpdateGarage,
} from './garage.interface';

/**
 * Haversine formula to compute great-circle distance between two geo-coordinates in KM
 */
const calculateHaversineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};

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
      latitude:
        payload.latitude !== undefined && payload.latitude !== null
          ? Number(payload.latitude)
          : null,
      longitude:
        payload.longitude !== undefined && payload.longitude !== null
          ? Number(payload.longitude)
          : null,
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
    minRating,
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

  if (minRating !== undefined) {
    whereConditions.push({
      averageRating: { gte: Number(minRating) },
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

const getNearbyGarages = async (query: INearbyGarageQuery) => {
  const userLat = Number(query.latitude);
  const userLon = Number(query.longitude);
  const maxRadiusKm = query.radius !== undefined ? Number(query.radius) : 10;
  const limit = query.limit !== undefined ? Number(query.limit) : 10;

  const whereConditions: Prisma.GarageWhereInput[] = [
    {
      latitude: { not: null },
      longitude: { not: null },
    },
  ];

  if (query.minPrice !== undefined) {
    whereConditions.push({ pricePerHour: { gte: Number(query.minPrice) } });
  }

  if (query.maxPrice !== undefined) {
    whereConditions.push({ pricePerHour: { lte: Number(query.maxPrice) } });
  }

  if (query.onlyAvailable === true || query.onlyAvailable === 'true') {
    whereConditions.push({ availableSlots: { gt: 0 } });
  }

  if (query.minRating !== undefined) {
    whereConditions.push({ averageRating: { gte: Number(query.minRating) } });
  }

  const garages = await prisma.garage.findMany({
    where: { AND: whereConditions },
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

  const nearbyGarages = garages
    .map((garage) => {
      const distanceKm = calculateHaversineDistanceKm(
        userLat,
        userLon,
        garage.latitude as number,
        garage.longitude as number,
      );
      return {
        ...garage,
        distanceKm,
      };
    })
    .filter((garage) => garage.distanceKm <= maxRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return {
    meta: {
      userLatitude: userLat,
      userLongitude: userLon,
      searchRadiusKm: maxRadiusKm,
      count: nearbyGarages.length,
    },
    data: nearbyGarages,
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
      reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              picture: true,
            },
          },
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

  const dataToUpdate: any = { ...payload };
  if (payload.latitude !== undefined) {
    dataToUpdate.latitude = payload.latitude !== null ? Number(payload.latitude) : null;
  }
  if (payload.longitude !== undefined) {
    dataToUpdate.longitude = payload.longitude !== null ? Number(payload.longitude) : null;
  }

  const updatedGarage = await prisma.garage.update({
    where: { id: garageId },
    data: dataToUpdate,
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
  getNearbyGarages,
  getMyGarages,
  getSingleGarage,
  updateGarage,
  deleteGarage,
};
