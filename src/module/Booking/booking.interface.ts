import type { BookingStatus } from '@prisma/client';

export interface ICreateBooking {
  garageId: string;
  startTime: string | Date;
  endTime: string | Date;
  vehicleNumber?: string;
}

export interface IUpdateBookingStatus {
  status: BookingStatus;
}

export interface IBookingQueryFilter {
  status?: BookingStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
