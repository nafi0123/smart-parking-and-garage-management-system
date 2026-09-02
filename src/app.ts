import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import globalErrorHandler from './app/errors/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import { UserRoutes } from './module/User/user.route';
import { AuthRoutes } from './module/Auth/auth.route';
import { GarageRoutes } from './module/Garage/garage.route';
import { BookingRoutes } from './module/Booking/booking.route';

const app: Application = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Application routes
app.use('/api/v1/users', UserRoutes);
app.use('/api/v1/auth', AuthRoutes);
app.use('/api/v1/garages', GarageRoutes);
app.use('/api/v1/bookings', BookingRoutes);

// Health check
app.get('/', (req: Request, res: Response) => {
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
