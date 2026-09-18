import { BookingStatus, PaymentStatus, Role } from '@prisma/client';
import prisma from '../../app/utils/prisma';

const getManagerAnalytics = async (managerId: string) => {
  const garages = await prisma.garage.findMany({
    where: { ownerId: managerId },
    select: {
      id: true,
      name: true,
      totalSlots: true,
      availableSlots: true,
      pricePerHour: true,
      averageRating: true,
      totalReviews: true,
      createdAt: true,
    },
  });

  const garageIds = garages.map((g) => g.id);

  if (garageIds.length === 0) {
    return {
      summary: {
        totalGarages: 0,
        totalSlots: 0,
        occupiedSlots: 0,
        occupancyRate: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        monthlyRevenue: 0,
        totalBookings: 0,
      },
      bookingStatusBreakdown: {
        CONFIRMED: 0,
        COMPLETED: 0,
        CANCELLED: 0,
        PENDING: 0,
      },
      revenueChart: [],
      topGarages: [],
    };
  }

  const totalSlots = garages.reduce((sum, g) => sum + g.totalSlots, 0);
  const availableSlots = garages.reduce((sum, g) => sum + g.availableSlots, 0);
  const occupiedSlots = Math.max(0, totalSlots - availableSlots);
  const occupancyRate =
    totalSlots > 0 ? Number(((occupiedSlots / totalSlots) * 100).toFixed(1)) : 0;

  // Date thresholds
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // Fetch all bookings for manager's garages
  const [allBookings, paidPayments] = await Promise.all([
    prisma.booking.findMany({
      where: { garageId: { in: garageIds } },
      select: {
        id: true,
        garageId: true,
        totalPrice: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        booking: { garageId: { in: garageIds } },
        status: PaymentStatus.PAID,
      },
      select: {
        amount: true,
        createdAt: true,
        booking: {
          select: { garageId: true },
        },
      },
    }),
  ]);

  // Total and Period Revenues
  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const todayRevenue = paidPayments
    .filter((p) => p.createdAt >= todayStart)
    .reduce((sum, p) => sum + p.amount, 0);
  const monthlyRevenue = paidPayments
    .filter((p) => p.createdAt >= monthStart)
    .reduce((sum, p) => sum + p.amount, 0);

  // Booking status breakdown
  const bookingStatusBreakdown = {
    CONFIRMED: allBookings.filter((b) => b.status === BookingStatus.CONFIRMED).length,
    COMPLETED: allBookings.filter((b) => b.status === BookingStatus.COMPLETED).length,
    CANCELLED: allBookings.filter((b) => b.status === BookingStatus.CANCELLED).length,
    PENDING: allBookings.filter((b) => b.status === BookingStatus.PENDING).length,
  };

  // 30-Day Daily Chart Data
  const revenueChart: { date: string; revenue: number; bookingsCount: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const day = new Date(thirtyDaysAgo);
    day.setDate(day.getDate() + i);
    const dateStr = day.toISOString().split('T')[0];

    const dayPayments = paidPayments.filter(
      (p) => p.createdAt.toISOString().split('T')[0] === dateStr,
    );
    const dayBookings = allBookings.filter(
      (b) => b.createdAt.toISOString().split('T')[0] === dateStr,
    );

    const dayRevenue = dayPayments.reduce((sum, p) => sum + p.amount, 0);

    revenueChart.push({
      date: dateStr,
      revenue: Number(dayRevenue.toFixed(2)),
      bookingsCount: dayBookings.length,
    });
  }

  // Top garages breakdown
  const topGarages = garages
    .map((garage) => {
      const garagePayments = paidPayments.filter((p) => p.booking?.garageId === garage.id);
      const garageRevenue = garagePayments.reduce((sum, p) => sum + p.amount, 0);
      const garageBookings = allBookings.filter((b) => b.garageId === garage.id);

      return {
        ...garage,
        totalRevenue: Number(garageRevenue.toFixed(2)),
        totalBookings: garageBookings.length,
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    summary: {
      totalGarages: garages.length,
      totalSlots,
      occupiedSlots,
      occupancyRate,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      todayRevenue: Number(todayRevenue.toFixed(2)),
      monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
      totalBookings: allBookings.length,
    },
    bookingStatusBreakdown,
    revenueChart,
    topGarages,
  };
};

const getAdminAnalytics = async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [users, totalGarages, bookings, payments, recentPayments] = await Promise.all([
    prisma.user.findMany({
      select: { role: true, createdAt: true },
    }),
    prisma.garage.count(),
    prisma.booking.findMany({
      select: { status: true, totalPrice: true, createdAt: true },
    }),
    prisma.payment.findMany({
      select: {
        amount: true,
        status: true,
        refundAmount: true,
        createdAt: true,
      },
    }),
    prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        booking: {
          select: {
            id: true,
            vehicleNumber: true,
            garage: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  // User Stats
  const userStats = {
    totalUsers: users.length,
    drivers: users.filter((u) => u.role === Role.DRIVER).length,
    managers: users.filter((u) => u.role === Role.MANAGER).length,
    admins: users.filter((u) => u.role === Role.ADMIN).length,
    newUsersThisMonth: users.filter((u) => u.createdAt >= monthStart).length,
  };

  // Payment & Financial Stats
  const paidPayments = payments.filter((p) => p.status === PaymentStatus.PAID);
  const totalPlatformRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalRefundedAmount = payments
    .filter((p) => p.status === PaymentStatus.REFUNDED)
    .reduce((sum, p) => sum + (p.refundAmount || 0), 0);
  const netRevenue = totalPlatformRevenue - totalRefundedAmount;

  const todayRevenue = paidPayments
    .filter((p) => p.createdAt >= todayStart)
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyRevenue = paidPayments
    .filter((p) => p.createdAt >= monthStart)
    .reduce((sum, p) => sum + p.amount, 0);

  // Booking Stats
  const bookingStats = {
    totalBookings: bookings.length,
    CONFIRMED: bookings.filter((b) => b.status === BookingStatus.CONFIRMED).length,
    COMPLETED: bookings.filter((b) => b.status === BookingStatus.COMPLETED).length,
    CANCELLED: bookings.filter((b) => b.status === BookingStatus.CANCELLED).length,
    PENDING: bookings.filter((b) => b.status === BookingStatus.PENDING).length,
  };

  // 12 Months Growth Chart for Current Year
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const yearlyChart = months.map((monthName, idx) => {
    const monthStartBound = new Date(now.getFullYear(), idx, 1);
    const monthEndBound = new Date(now.getFullYear(), idx + 1, 0, 23, 59, 59);

    const monthPaid = paidPayments.filter(
      (p) => p.createdAt >= monthStartBound && p.createdAt <= monthEndBound,
    );
    const monthBookings = bookings.filter(
      (b) => b.createdAt >= monthStartBound && b.createdAt <= monthEndBound,
    );
    const monthUsers = users.filter(
      (u) => u.createdAt >= monthStartBound && u.createdAt <= monthEndBound,
    );

    const revenue = monthPaid.reduce((sum, p) => sum + p.amount, 0);

    return {
      month: monthName,
      revenue: Number(revenue.toFixed(2)),
      bookings: monthBookings.length,
      newUsers: monthUsers.length,
    };
  });

  return {
    summary: {
      totalUsers: userStats.totalUsers,
      totalGarages,
      totalBookings: bookingStats.totalBookings,
      totalPlatformRevenue: Number(totalPlatformRevenue.toFixed(2)),
      totalRefundedAmount: Number(totalRefundedAmount.toFixed(2)),
      netRevenue: Number(netRevenue.toFixed(2)),
      todayRevenue: Number(todayRevenue.toFixed(2)),
      monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
    },
    userStats,
    bookingStats,
    yearlyChart,
    recentTransactions: recentPayments,
  };
};

export const AnalyticsService = {
  getManagerAnalytics,
  getAdminAnalytics,
};
