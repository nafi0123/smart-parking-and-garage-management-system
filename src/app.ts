import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Application, type Request, type Response } from 'express';
import globalErrorHandler from './app/errors/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import { AnalyticsRoutes } from './module/Analytics/analytics.route';
import { AuthRoutes } from './module/Auth/auth.route';
import { BookingRoutes } from './module/Booking/booking.route';
import { FavoriteRoutes } from './module/Favorite/favorite.route';
import { GarageRoutes } from './module/Garage/garage.route';
import { PaymentRoutes } from './module/Payment/payment.route';
import { ReviewRoutes } from './module/Review/review.route';
import { UserRoutes } from './module/User/user.route';
import { VehicleRoutes } from './module/Vehicle/vehicle.route';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: [
      'https://smart-parking-backend-omega.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5000',
      process.env.FRONTEND_URL || '',
    ].filter(Boolean),
    credentials: true,
  }),
);

// Application routes
app.use('/api/v1/users', UserRoutes);
app.use('/api/v1/auth', AuthRoutes);
app.use('/api/v1/garages', GarageRoutes);
app.use('/api/v1/bookings', BookingRoutes);
app.use('/api/v1/payments', PaymentRoutes);
app.use('/api/v1/reviews', ReviewRoutes);
app.use('/api/v1/vehicles', VehicleRoutes);
app.use('/api/v1/favorites', FavoriteRoutes);
app.use('/api/v1/analytics', AnalyticsRoutes);

// Test Google Login page
app.get('/test-google', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'test-google-login.html'));
});

// Health check
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Smart Parking & Garage Management System API is running',
  });
});

// Global error handler
app.use(globalErrorHandler);

// 404 handler
app.use(notFound);

export default app;
