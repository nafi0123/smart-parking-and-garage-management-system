import fs from 'node:fs';
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
const allowedOrigins = [
  'https://smrat-parking-frontend.vercel.app',
  'https://smrat-parking-frontend-c0ts8jmxf-nafi-mahmud-bukharis-projects.vercel.app',
  'https://smart-parking-frontend.vercel.app',
  'https://smart-parking-backend-omega.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  process.env.FRONTEND_URL || '',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
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

// Test Google Login page (handles both GET page load and POST redirect from Google)
app.all('/test-google', async (req: Request, res: Response) => {
  const credential =
    (req.body?.credential as string | undefined) ||
    (req.query?.credential as string | undefined) ||
    '';

  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://smrat-parking-frontend.vercel.app';

  // If credential received via POST (from Google redirect), auto-login and redirect to frontend
  if (credential && req.method === 'POST') {
    try {
      const { AuthService } = await import('./module/Auth/auth.service');
      const result = await AuthService.googleLogin({ idToken: credential });

      const redirectUrl = new URL(`${FRONTEND_URL}/login`);
      redirectUrl.searchParams.set('accessToken', result.accessToken);
      redirectUrl.searchParams.set('user', JSON.stringify(result.user));
      return res.redirect(redirectUrl.toString());
    } catch (err: any) {
      const msg = err?.message || 'Google login failed';
      return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(msg)}`);
    }
  }

  // GET request: serve the test page HTML
  const filePath = path.join(process.cwd(), 'test-google-login.html');
  try {
    let html = fs.readFileSync(filePath, 'utf-8');
    if (credential) {
      html = html.replace(
        '/* __SERVER_TOKEN_PLACEHOLDER__ */',
        `window.__SERVER_TOKEN__ = ${JSON.stringify(credential)};`,
      );
    }
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (_err) {
    res.status(500).send('Error loading test page');
  }
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
