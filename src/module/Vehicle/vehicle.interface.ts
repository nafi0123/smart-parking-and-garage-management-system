import type { VehicleType } from '@prisma/client';

export interface ICreateVehicle {
  vehicleNumber: string;
  vehicleType?: VehicleType;
  model?: string;
  color?: string;
  isDefault?: boolean;
}

export interface IUpdateVehicle {
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  model?: string;
  color?: string;
  isDefault?: boolean;
}
