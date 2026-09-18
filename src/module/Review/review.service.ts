import AppError from '../../app/errors/AppError';
import prisma from '../../app/utils/prisma';
import type { ICreateReview, IReviewQuery, IUpdateReview } from './review.interface';

/**
 * Helper to recalculate and cache average rating and review count on the Garage record
 */
const recalculateGarageRating = async (garageId: string) => {
  const aggregate = await prisma.review.aggregate({
    where: { garageId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const averageRating = aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : 0;
  const totalReviews = aggregate._count.rating || 0;

  await prisma.garage.update({
    where: { id: garageId },
    data: {
      averageRating,
      totalReviews,
    },
  });
};

const createReview = async (userId: string, payload: ICreateReview) => {
  const booking = await prisma.booking.findUnique({
    where: { id: payload.bookingId },
    include: { review: true },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found!');
  }

  if (booking.userId !== userId) {
    throw new AppError(403, 'You are not authorized to review this booking!');
  }

  if (booking.status !== 'COMPLETED') {
    throw new AppError(
      400,
      'You can only review this garage after your parking booking status is COMPLETED!',
    );
  }

  if (booking.review) {
    throw new AppError(400, 'You have already submitted a review for this booking!');
  }

  const review = await prisma.review.create({
    data: {
      userId,
      garageId: booking.garageId,
      bookingId: payload.bookingId,
      rating: payload.rating,
      comment: payload.comment,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          picture: true,
        },
      },
      garage: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
    },
  });

  await recalculateGarageRating(booking.garageId);

  return review;
};

const getGarageReviews = async (garageId: string, query: IReviewQuery) => {
  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
    select: {
      id: true,
      name: true,
      averageRating: true,
      totalReviews: true,
    },
  });

  if (!garage) {
    throw new AppError(404, 'Garage not found!');
  }

  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { garageId },
      skip,
      take: limitNum,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true,
          },
        },
      },
    }),
    prisma.review.count({ where: { garageId } }),
  ]);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPage: Math.ceil(total / limitNum),
      averageRating: garage.averageRating,
      totalReviews: garage.totalReviews,
    },
    data: reviews,
  };
};

const getMyReviews = async (userId: string) => {
  const reviews = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      garage: {
        select: {
          id: true,
          name: true,
          address: true,
          location: true,
          images: true,
          averageRating: true,
        },
      },
    },
  });

  return reviews;
};

const updateReview = async (reviewId: string, userId: string, payload: IUpdateReview) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new AppError(404, 'Review not found!');
  }

  if (review.userId !== userId) {
    throw new AppError(403, 'You can only update your own review!');
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: payload.rating !== undefined ? payload.rating : review.rating,
      comment: payload.comment !== undefined ? payload.comment : review.comment,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          picture: true,
        },
      },
    },
  });

  if (payload.rating !== undefined && payload.rating !== review.rating) {
    await recalculateGarageRating(review.garageId);
  }

  return updatedReview;
};

const deleteReview = async (reviewId: string, userId: string, userRole: string) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new AppError(404, 'Review not found!');
  }

  if (review.userId !== userId && userRole !== 'ADMIN') {
    throw new AppError(403, 'You are not authorized to delete this review!');
  }

  await prisma.review.delete({
    where: { id: reviewId },
  });

  await recalculateGarageRating(review.garageId);

  return null;
};

export const ReviewService = {
  createReview,
  getGarageReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
