import { BookingStatus, PaymentStatus, type Prisma } from '@prisma/client';
import AppError from '../../app/errors/AppError';
import prisma from '../../app/utils/prisma';
import { SSLCommerzService } from '../Payment/sslcommerz.service';
import type {
  IBookingQueryFilter,
  ICreateBooking,
  IUpdateBookingStatus,
} from './booking.interface';

const createBooking = async (userId: string, payload: ICreateBooking) => {
  // Check if garage exists
  const garage = await prisma.garage.findUnique({
    where: { id: payload.garageId },
  });

  if (!garage) {
    throw new AppError(404, 'Garage not found!');
  }

  // Check if available slots are > 0
  if (garage.availableSlots <= 0) {
    throw new AppError(400, 'No available parking slots in this garage!');
  }

  const start = new Date(payload.startTime);
  const end = new Date(payload.endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError(400, 'Invalid startTime or endTime format!');
  }

  if (start >= end) {
    throw new AppError(400, 'End time must be after start time!');
  }

  // Calculate duration in hours
  const durationInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  const totalPrice = Number((durationInHours * garage.pricePerHour).toFixed(2));

  // Get user details for SSLCommerz payment
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found!');
  }

  const transactionId = `TRX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Create booking & payment record. Available slots will decrement only AFTER payment confirmation!
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const booking = await tx.booking.create({
      data: {
        userId,
        garageId: payload.garageId,
        startTime: start,
        endTime: end,
        vehicleNumber: payload.vehicleNumber,
        totalPrice,
        status: BookingStatus.PENDING,
      },
      include: {
        garage: {
          select: {
            id: true,
            name: true,
            address: true,
            pricePerHour: true,
            location: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const payment = await tx.payment.create({
      data: {
        bookingId: booking.id,
        userId,
        amount: totalPrice,
        transactionId,
        status: PaymentStatus.PENDING,
      },
    });

    return { booking, payment };
  });

  // Request SSLCommerz payment checkout URL
  let paymentUrl: string | null = null;
  try {
    paymentUrl = await SSLCommerzService.initPayment({
      amount: totalPrice,
      transactionId,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone,
      customerAddress: garage.address,
      productName: `Parking at ${garage.name}`,
    });
  } catch (error: any) {
    console.error('SSLCommerz session initialization error:', error.message);
  }

  return {
    ...result.booking,
    payment: result.payment,
    paymentUrl,
    transactionId,
  };
};

const getMyBookings = async (userId: string) => {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      payment: true,
      garage: {
        select: {
          id: true,
          name: true,
          address: true,
          location: true,
          pricePerHour: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  return bookings;
};

const getManagerBookings = async (managerId: string) => {
  const bookings = await prisma.booking.findMany({
    where: {
      garage: {
        ownerId: managerId,
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      payment: true,
      garage: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return bookings;
};

const getAllBookings = async (query: IBookingQueryFilter) => {
  const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const whereConditions: Prisma.BookingWhereInput[] = [];

  if (status) {
    whereConditions.push({ status });
  }

  const where: Prisma.BookingWhereInput =
    whereConditions.length > 0 ? { AND: whereConditions } : {};

  const bookings = await prisma.booking.findMany({
    where,
    skip,
    take: limitNum,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      payment: true,
      garage: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  const total = await prisma.booking.count({ where });
  const totalPage = Math.ceil(total / limitNum);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPage,
    },
    data: bookings,
  };
};

const getSingleBooking = async (bookingId: string, userId: string, userRole: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      garage: {
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
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found!');
  }

  // Authorization check
  if (booking.userId !== userId && booking.garage.ownerId !== userId && userRole !== 'ADMIN') {
    throw new AppError(403, 'You are not authorized to view this booking!');
  }

  return booking;
};

const cancelBooking = async (bookingId: string, userId: string, userRole: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { garage: true },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found!');
  }

  // Authorization check (Booking user, Garage owner, or Admin)
  if (booking.userId !== userId && booking.garage.ownerId !== userId && userRole !== 'ADMIN') {
    throw new AppError(403, 'You are not authorized to cancel this booking!');
  }

  if (booking.status === BookingStatus.CANCELLED) {
    throw new AppError(400, 'Booking is already cancelled!');
  }

  if (booking.status === BookingStatus.COMPLETED) {
    throw new AppError(400, 'Cannot cancel a completed booking!');
  }

  const wasConfirmed = booking.status === BookingStatus.CONFIRMED;

  // Transaction: Cancel booking & increment slots ONLY if it was previously confirmed (paid)
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    if (wasConfirmed) {
      await tx.garage.update({
        where: { id: booking.garageId },
        data: {
          availableSlots: {
            increment: 1,
          },
        },
      });
    }

    return updatedBooking;
  });

  return result;
};

const updateBookingStatus = async (
  bookingId: string,
  userId: string,
  userRole: string,
  payload: IUpdateBookingStatus,
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { garage: true },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found!');
  }

  // Only Garage owner or Admin can update status
  if (booking.garage.ownerId !== userId && userRole !== 'ADMIN') {
    throw new AppError(403, 'You are not authorized to update this booking status!');
  }

  const oldStatus = booking.status;
  const newStatus = payload.status;

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });

    // If changing to CONFIRMED from PENDING, decrement available slot
    if (oldStatus === BookingStatus.PENDING && newStatus === BookingStatus.CONFIRMED) {
      if (booking.garage.availableSlots <= 0) {
        throw new AppError(400, 'No available parking slots remaining in this garage!');
      }
      await tx.garage.update({
        where: { id: booking.garageId },
        data: {
          availableSlots: {
            decrement: 1,
          },
        },
      });
    }

    // If changing to CANCELLED or COMPLETED from CONFIRMED state, release slot back
    if (
      (newStatus === BookingStatus.CANCELLED || newStatus === BookingStatus.COMPLETED) &&
      oldStatus === BookingStatus.CONFIRMED
    ) {
      await tx.garage.update({
        where: { id: booking.garageId },
        data: {
          availableSlots: {
            increment: 1,
          },
        },
      });
    }

    return updatedBooking;
  });

  return result;
};

export const BookingService = {
  createBooking,
  getMyBookings,
  getManagerBookings,
  getAllBookings,
  getSingleBooking,
  cancelBooking,
  updateBookingStatus,
};
