import AppError from '../../app/errors/AppError';
import prisma from '../../app/utils/prisma';
import type { ICreateVehicle, IUpdateVehicle } from './vehicle.interface';

const createVehicle = async (userId: string, payload: ICreateVehicle) => {
  const normalizedNumber = payload.vehicleNumber.trim().toUpperCase();

  const existing = await prisma.vehicle.findUnique({
    where: {
      userId_vehicleNumber: {
        userId,
        vehicleNumber: normalizedNumber,
      },
    },
  });

  if (existing) {
    throw new AppError(400, 'This vehicle number is already registered in your account!');
  }

  // If set as default, reset other vehicles
  if (payload.isDefault) {
    await prisma.vehicle.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      userId,
      vehicleNumber: normalizedNumber,
      vehicleType: payload.vehicleType || 'CAR',
      model: payload.model,
      color: payload.color,
      isDefault: payload.isDefault || false,
    },
  });

  return vehicle;
};

const getMyVehicles = async (userId: string) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return vehicles;
};

const getSingleVehicle = async (vehicleId: string, userId: string) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!vehicle) {
    throw new AppError(404, 'Vehicle not found!');
  }

  if (vehicle.userId !== userId) {
    throw new AppError(403, 'You are not authorized to view this vehicle!');
  }

  return vehicle;
};

const updateVehicle = async (vehicleId: string, userId: string, payload: IUpdateVehicle) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!vehicle) {
    throw new AppError(404, 'Vehicle not found!');
  }

  if (vehicle.userId !== userId) {
    throw new AppError(403, 'You are not authorized to update this vehicle!');
  }

  if (payload.isDefault) {
    await prisma.vehicle.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      vehicleNumber: payload.vehicleNumber
        ? payload.vehicleNumber.trim().toUpperCase()
        : vehicle.vehicleNumber,
      vehicleType: payload.vehicleType || vehicle.vehicleType,
      model: payload.model !== undefined ? payload.model : vehicle.model,
      color: payload.color !== undefined ? payload.color : vehicle.color,
      isDefault: payload.isDefault !== undefined ? payload.isDefault : vehicle.isDefault,
    },
  });

  return updatedVehicle;
};

const deleteVehicle = async (vehicleId: string, userId: string) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!vehicle) {
    throw new AppError(404, 'Vehicle not found!');
  }

  if (vehicle.userId !== userId) {
    throw new AppError(403, 'You are not authorized to delete this vehicle!');
  }

  await prisma.vehicle.delete({
    where: { id: vehicleId },
  });

  return null;
};

export const VehicleService = {
  createVehicle,
  getMyVehicles,
  getSingleVehicle,
  updateVehicle,
  deleteVehicle,
};
