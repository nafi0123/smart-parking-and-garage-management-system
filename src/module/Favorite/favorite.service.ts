import AppError from '../../app/errors/AppError';
import prisma from '../../app/utils/prisma';

const toggleFavorite = async (userId: string, garageId: string) => {
  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
  });

  if (!garage) {
    throw new AppError(404, 'Garage not found!');
  }

  const existingFavorite = await prisma.favoriteGarage.findUnique({
    where: {
      userId_garageId: {
        userId,
        garageId,
      },
    },
  });

  if (existingFavorite) {
    await prisma.favoriteGarage.delete({
      where: { id: existingFavorite.id },
    });

    return {
      isFavorited: false,
      message: 'Garage removed from your favorites',
      garageId,
    };
  }

  await prisma.favoriteGarage.create({
    data: {
      userId,
      garageId,
    },
  });

  return {
    isFavorited: true,
    message: 'Garage added to your favorites',
    garageId,
  };
};

const getMyFavorites = async (userId: string) => {
  const favorites = await prisma.favoriteGarage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
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
    },
  });

  return favorites.map((fav) => ({
    favoriteId: fav.id,
    favoritedAt: fav.createdAt,
    ...fav.garage,
  }));
};

const checkIsFavorite = async (userId: string, garageId: string) => {
  const favorite = await prisma.favoriteGarage.findUnique({
    where: {
      userId_garageId: {
        userId,
        garageId,
      },
    },
  });

  return {
    garageId,
    isFavorited: !!favorite,
  };
};

export const FavoriteService = {
  toggleFavorite,
  getMyFavorites,
  checkIsFavorite,
};
