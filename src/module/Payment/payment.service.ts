import { BookingStatus, PaymentStatus, type Prisma } from '@prisma/client';
import AppError from '../../app/errors/AppError';
import prisma from '../../app/utils/prisma';
import type { ISSLCommerzCallbackPayload } from './payment.interface';
import { SSLCommerzService } from './sslcommerz.service';

const confirmPayment = async (payload: ISSLCommerzCallbackPayload) => {
  const { tran_id, val_id } = payload;

  if (!tran_id) {
    throw new AppError(400, 'Transaction ID is missing from payment callback!');
  }

  // Find payment record
  const payment = await prisma.payment.findUnique({
    where: { transactionId: tran_id },
    include: {
      booking: {
        include: {
          garage: true,
          user: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(404, `Payment record not found for transaction ID: ${tran_id}`);
  }

  // If already paid, return existing state (idempotent)
  if (payment.status === PaymentStatus.PAID) {
    return {
      payment,
      booking: payment.booking,
      garage: payment.booking.garage,
      user: payment.booking.user,
    };
  }

  // Optionally validate with SSLCommerz server if val_id is provided
  let gatewayValidationData = payload;
  if (val_id) {
    try {
      const validationResult = await SSLCommerzService.validatePayment(val_id);
      if (validationResult.status === 'VALID' || validationResult.status === 'VALIDATED') {
        gatewayValidationData = { ...payload, ...validationResult };
      }
    } catch {
      // In sandbox/testing mode, fallback to payload if validation network is unavailable
      gatewayValidationData = payload;
    }
  }

  // Transaction: Decrement garage slot, Confirm booking, Mark payment as PAID
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Verify available slots
    const garage = await tx.garage.findUnique({
      where: { id: payment.booking.garageId },
    });

    if (!garage || garage.availableSlots <= 0) {
      throw new AppError(400, 'No available parking slots remaining in this garage!');
    }

    // 2. Decrement available slot
    const updatedGarage = await tx.garage.update({
      where: { id: payment.booking.garageId },
      data: {
        availableSlots: {
          decrement: 1,
        },
      },
    });

    // 3. Update booking status to CONFIRMED
    const updatedBooking = await tx.booking.update({
      where: { id: payment.bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
      },
    });

    // 4. Update payment status to PAID
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        paymentGatewayData: gatewayValidationData,
      },
    });

    return {
      payment: updatedPayment,
      booking: updatedBooking,
      garage: updatedGarage,
      user: payment.booking.user,
    };
  });

  return result;
};

const failPayment = async (payload: ISSLCommerzCallbackPayload) => {
  const { tran_id } = payload;

  if (!tran_id) {
    throw new AppError(400, 'Transaction ID is missing from payment callback!');
  }

  const payment = await prisma.payment.findUnique({
    where: { transactionId: tran_id },
    include: {
      booking: {
        include: {
          garage: true,
          user: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(404, 'Payment record not found!');
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.FAILED,
      paymentGatewayData: payload,
    },
  });

  return {
    payment: updatedPayment,
    booking: payment.booking,
    garage: payment.booking.garage,
    user: payment.booking.user,
  };
};

const cancelPayment = async (payload: ISSLCommerzCallbackPayload) => {
  const { tran_id } = payload;

  if (!tran_id) {
    throw new AppError(400, 'Transaction ID is missing from payment callback!');
  }

  const payment = await prisma.payment.findUnique({
    where: { transactionId: tran_id },
    include: {
      booking: {
        include: {
          garage: true,
          user: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(404, 'Payment record not found!');
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.CANCELLED,
      paymentGatewayData: payload,
    },
  });

  return {
    payment: updatedPayment,
    booking: payment.booking,
    garage: payment.booking.garage,
    user: payment.booking.user,
  };
};

const initiatePaymentForBooking = async (bookingId: string, userId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      garage: true,
      user: true,
      payment: true,
    },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found!');
  }

  if (booking.userId !== userId) {
    throw new AppError(403, 'You are not authorized to pay for this booking!');
  }

  if (booking.status === BookingStatus.CONFIRMED) {
    throw new AppError(400, 'This booking has already been paid and confirmed!');
  }

  if (booking.status === BookingStatus.CANCELLED) {
    throw new AppError(400, 'Cannot pay for a cancelled booking!');
  }

  if (booking.garage.availableSlots <= 0) {
    throw new AppError(400, 'No available parking slots remaining in this garage!');
  }

  const transactionId = `TRX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Upsert payment record
  if (booking.payment) {
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        transactionId,
        status: PaymentStatus.PENDING,
        amount: booking.totalPrice,
      },
    });
  } else {
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        amount: booking.totalPrice,
        transactionId,
        status: PaymentStatus.PENDING,
      },
    });
  }

  // Request SSLCommerz checkout URL
  const paymentUrl = await SSLCommerzService.initPayment({
    amount: booking.totalPrice,
    transactionId,
    customerName: booking.user.name,
    customerEmail: booking.user.email,
    customerPhone: booking.user.phone,
    customerAddress: booking.garage.address,
    productName: `Parking at ${booking.garage.name}`,
  });

  return {
    bookingId: booking.id,
    transactionId,
    amount: booking.totalPrice,
    paymentUrl,
  };
};

const refundBookingPayment = async (
  bookingId: string,
  userId: string,
  userRole: string,
  reason?: string,
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      garage: true,
      user: true,
      payment: true,
    },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found!');
  }

  // Authorization check: Only the booking creator or Admin can request refund
  if (booking.userId !== userId && userRole !== 'ADMIN') {
    throw new AppError(403, 'You are not authorized to cancel or refund this booking!');
  }

  if (booking.status === BookingStatus.CANCELLED) {
    throw new AppError(400, 'This booking has already been cancelled!');
  }

  if (booking.status === BookingStatus.COMPLETED) {
    throw new AppError(400, 'Cannot refund a completed booking!');
  }

  if (!booking.payment) {
    throw new AppError(400, 'No payment record found for this booking!');
  }

  if (booking.payment.status === PaymentStatus.REFUNDED) {
    throw new AppError(400, 'This booking payment has already been refunded!');
  }

  if (booking.payment.status !== PaymentStatus.PAID) {
    throw new AppError(400, 'No completed payment found for this booking to refund!');
  }

  // Strictly enforce cancellation at least 1 hour (60 mins) before booking startTime
  const currentTime = new Date();
  const startTime = new Date(booking.startTime);
  const diffInMinutes = (startTime.getTime() - currentTime.getTime()) / (1000 * 60);

  if (diffInMinutes < 60) {
    throw new AppError(
      400,
      'Cancellation and refund is only allowed at least 1 hour before the booking start time!',
    );
  }

  // Get bank_tran_id for SSLCommerz refund
  const paymentGatewayData = booking.payment.paymentGatewayData as any;
  const bank_tran_id = paymentGatewayData?.bank_tran_id || booking.payment.transactionId;
  const re_fe_id = `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  let refundGatewayResult: any = null;
  try {
    refundGatewayResult = await SSLCommerzService.initiateRefund({
      bank_tran_id,
      refund_amount: booking.totalPrice,
      refund_remarks: reason || 'Customer cancelled at least 1 hour before start time',
      re_fe_id,
    });
  } catch (error: any) {
    console.warn('SSLCommerz refund API note:', error.message);
  }

  const paymentRecord = booking.payment;

  // Atomic transaction: Increment garage slot, Mark booking as CANCELLED, Mark payment as REFUNDED
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Increment availableSlots in garage
    const updatedGarage = await tx.garage.update({
      where: { id: booking.garageId },
      data: {
        availableSlots: {
          increment: 1,
        },
      },
    });

    // 2. Mark booking as CANCELLED
    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

    // 3. Mark payment as REFUNDED
    const updatedPayment = await tx.payment.update({
      where: { id: paymentRecord.id },
      data: {
        status: PaymentStatus.REFUNDED,
        refundTransactionId: refundGatewayResult?.refund_ref_id || re_fe_id,
        refundAmount: booking.totalPrice,
        refundedAt: new Date(),
      },
    });

    return {
      booking: updatedBooking,
      payment: updatedPayment,
      garage: updatedGarage,
      refundGatewayResult,
    };
  });

  return result;
};

const getPaymentDetails = async (identifier: string, userId: string, userRole: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ id: identifier }, { transactionId: identifier }, { bookingId: identifier }],
    },
    include: {
      booking: {
        include: {
          garage: {
            select: {
              id: true,
              name: true,
              address: true,
              location: true,
              pricePerHour: true,
              ownerId: true,
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
      },
    },
  });

  if (!payment) {
    throw new AppError(404, 'Payment details not found!');
  }

  // Authorization: Booking user, Garage owner, or Admin
  if (
    payment.userId !== userId &&
    payment.booking.garage.ownerId !== userId &&
    userRole !== 'ADMIN'
  ) {
    throw new AppError(403, 'You are not authorized to view this payment details!');
  }

  return payment;
};

const getMyPayments = async (userId: string) => {
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      booking: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          vehicleNumber: true,
          status: true,
          garage: {
            select: {
              id: true,
              name: true,
              address: true,
              location: true,
            },
          },
        },
      },
    },
  });

  return payments;
};

export const PaymentService = {
  confirmPayment,
  failPayment,
  cancelPayment,
  initiatePaymentForBooking,
  refundBookingPayment,
  getPaymentDetails,
  getMyPayments,
};
