# 🚗 Smart Parking & Garage Management System — Backend API

[![Live API](https://img.shields.io/badge/Vercel-Live%20API-black?logo=vercel)](https://smart-parking-backend-omega.vercel.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express-5.x-lightgrey?logo=express)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Cloud-DC382D?logo=redis)](https://redis.io/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?logo=cloudinary)](https://cloudinary.com/)
[![SSLCommerz](https://img.shields.io/badge/SSLCommerz-Payment-025492)](https://sslcommerz.com/)

A modern, robust, and production-ready RESTful API backend for a **Smart Parking and Garage Management System**. Built with **TypeScript**, **Express 5**, **Prisma ORM**, **PostgreSQL**, **Redis**, and integrated with **Google OAuth**, **SSLCommerz Payment Gateway**, **Cloudinary**, and **PDFKit**.

---

## 🌐 Live Deployment

- **Live Base URL:** [https://smart-parking-backend-omega.vercel.app](https://smart-parking-backend-omega.vercel.app)
- **Health Check:** `GET https://smart-parking-backend-omega.vercel.app/`
- **Google OAuth Test UI:** [https://smart-parking-backend-omega.vercel.app/test-google](https://smart-parking-backend-omega.vercel.app/test-google)

---

## 🌟 Key Features

### 1. 🔐 Authentication & Role-Based Access Control
- **Email & Password Authentication:** Secure hashing via `bcrypt` with salt rounds.
- **OTP Email Verification:** Real-time OTP generation and verification cached in **Redis** with automated expiry.
- **Google OAuth 2.0 Integration:** ID Token cryptographic verification via `google-auth-library` with **Unified Account Linking** (no duplicate accounts).
- **JWT Authentication:** Dual-token security with short-lived `accessToken` and `refreshToken` stored in `httpOnly` secure cookies.
- **Role Hierarchy:** Granular permissions for `DRIVER`, `MANAGER`, and `ADMIN`.

### 2. 🏢 Garage Management & Cloudinary Uploads
- **Multi-Image Uploads:** Upload multiple garage photos directly to **Cloudinary** via **Multer memory buffers** (no disk pollution).
- **Capacity & Slot Tracking:** Real-time tracking of `totalSlots` and `availableSlots`.
- **Search & Advanced Filters:** Filter by price range (`minPrice`, `maxPrice`), availability, search keywords, and ratings.

### 3. 📍 Geospatial Nearby Garages Search
- **Haversine Distance Formula:** Computes precise great-circle distance between user's geo-coordinates (`latitude`, `longitude`) and garages in kilometers.
- **Distance Sorting:** Garages returned sorted ascending by `distanceKm` (nearest first) within customizable `radius` (km).

### 4. 💳 SSLCommerz Payment Gateway & Refunds
- **Slot Reservation Safety:** Available slots decrement **only after** payment status is confirmed (`PAID`), eliminating ghost bookings.
- **Automated Refund & Slot Restoration:** Full refund support for cancellations requested at least 1 hour prior to `startTime`, instantly freeing the slot.
- **Dynamic HTML Receipt:** Styled web receipt for browser redirects with direct links back to frontend.

### 5. ⭐ Garage Review & Rating System
- **Verified Booking Requirement:** Only drivers with **`COMPLETED`** parking bookings can rate and review a garage.
- **Auto Rating Recalculation:** `averageRating` and `totalReviews` on `Garage` model are automatically aggregated and cached upon review create/update/delete.

### 6. 📈 Manager & Admin Analytics Dashboard
- **Manager Dashboard (`GET /api/v1/analytics/manager`):** Real-time revenue, occupancy rate (`%`), booking status breakdown, top-performing garages, and 30-day daily revenue chart data.
- **Admin Dashboard (`GET /api/v1/analytics/admin`):** Platform-wide revenue, refunds, user role distribution, and 12-month yearly growth trends.

### 7. 🧾 Server-Side PDF Invoice Generator
- **PDFKit Streaming:** Dynamic generation of official parking invoices and payment receipts (`GET /api/v1/bookings/:id/invoice`) with itemized billing, timestamps, and verification badges.

### 8. 🚗 Saved Vehicles & Favorite Garages
- **Multi-Vehicle Profile:** Drivers can save multiple vehicles (`CAR`, `BIKE`, `SUV`, `TRUCK`, `VAN`) and set a `default` vehicle for 1-click booking.
- **Bookmark Garages:** 1-click favorite toggle to save frequently used garages.

---

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| **Runtime & Language** | Node.js (v20+), TypeScript (v5.9) |
| **Framework** | Express.js (v5.x) |
| **Database & ORM** | PostgreSQL, Prisma ORM (v5.22) |
| **Caching & In-Memory** | Redis Cloud (`ioredis`) |
| **Authentication** | JWT (`jsonwebtoken`), Google OAuth (`google-auth-library`), Bcrypt |
| **Payment Gateway** | SSLCommerz Payment Gateway |
| **Media Storage** | Cloudinary v2, Multer |
| **PDF Generation** | PDFKit |
| **Validation & Linting** | Zod, Biome |
| **Deployment** | Vercel (Serverless Functions) |

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/send-otp` | Public | Send verification OTP to email |
| `POST` | `/api/v1/auth/verify-otp` | Public | Verify OTP and register user |
| `POST` | `/api/v1/auth/login` | Public | Login with email & password |
| `POST` | `/api/v1/auth/google-login` | Public | Login/Register via Google ID Token |
| `POST` | `/api/v1/auth/refresh-token` | Public | Refresh expired access token |

### 🏢 Garages (`/api/v1/garages`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/garages` | Manager, Admin | Create garage (with images/multipart) |
| `GET` | `/api/v1/garages` | Public | Get all garages (Search & Filter) |
| `GET` | `/api/v1/garages/nearby` | Public | Search nearby garages by coordinates |
| `GET` | `/api/v1/garages/my-garages` | Manager, Admin | Get garages owned by logged in manager |
| `GET` | `/api/v1/garages/:id` | Public | Get single garage details & reviews |
| `PATCH` | `/api/v1/garages/:id` | Manager, Admin | Update garage details & images |
| `DELETE`| `/api/v1/garages/:id` | Manager, Admin | Delete garage |

### 📅 Bookings (`/api/v1/bookings`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/bookings` | All Roles | Create parking slot reservation |
| `GET` | `/api/v1/bookings/my-bookings` | All Roles | Get user's booking history |
| `GET` | `/api/v1/bookings/manager-bookings` | Manager, Admin | Get bookings for manager's garages |
| `GET` | `/api/v1/bookings/:id` | Authenticated | Get booking details |
| `GET` | `/api/v1/bookings/:id/invoice` | Authenticated | Download official PDF Invoice |
| `PATCH` | `/api/v1/bookings/:id/cancel` | Authenticated | Cancel booking |
| `PATCH` | `/api/v1/bookings/:id/status` | Manager, Admin | Update booking status (`COMPLETED`, etc.) |

### 💳 Payments (`/api/v1/payments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/payments/initiate/:bookingId` | Authenticated | Initiate SSLCommerz payment session |
| `POST` | `/api/v1/payments/confirm` | Public (Gateway) | SSLCommerz payment success IPN callback |
| `POST` | `/api/v1/payments/fail` | Public (Gateway) | SSLCommerz payment fail callback |
| `POST` | `/api/v1/payments/cancel` | Public (Gateway) | SSLCommerz payment cancel callback |
| `POST` | `/api/v1/payments/refund/:bookingId` | Authenticated | Cancel booking with SSLCommerz refund |
| `GET` | `/api/v1/payments/my-payments` | Authenticated | Get user's payment history |
| `GET` | `/api/v1/payments/:identifier` | Authenticated | Get payment by paymentId/bookingId/trxId |

### ⭐ Reviews (`/api/v1/reviews`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/reviews` | Authenticated | Submit review for completed booking |
| `GET` | `/api/v1/reviews/garage/:garageId` | Public | Get all reviews for a garage |
| `GET` | `/api/v1/reviews/my-reviews` | Authenticated | Get user's submitted reviews |
| `PATCH` | `/api/v1/reviews/:id` | Authenticated | Update review rating / comment |
| `DELETE`| `/api/v1/reviews/:id` | Authenticated | Delete review |

### 🚗 Saved Vehicles (`/api/v1/vehicles`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/vehicles` | Authenticated | Save new vehicle |
| `GET` | `/api/v1/vehicles/my-vehicles` | Authenticated | Get list of user's saved vehicles |
| `GET` | `/api/v1/vehicles/:id` | Authenticated | Get single vehicle details |
| `PATCH` | `/api/v1/vehicles/:id` | Authenticated | Update vehicle / toggle default |
| `DELETE`| `/api/v1/vehicles/:id` | Authenticated | Delete saved vehicle |

### ❤️ Favorite Garages (`/api/v1/favorites`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/favorites/:garageId` | Authenticated | Toggle garage bookmark (Add/Remove) |
| `GET` | `/api/v1/favorites/my-favorites` | Authenticated | Get user's favorited garages |
| `GET` | `/api/v1/favorites/check/:garageId` | Authenticated | Check if a garage is bookmarked |

### 📈 Analytics Dashboard (`/api/v1/analytics`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/analytics/manager` | Manager, Admin | Manager revenue & occupancy metrics |
| `GET` | `/api/v1/analytics/admin` | Admin | Super admin platform-wide analytics |

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgres://username:password@host:5432/dbname?sslmode=require"

BCRYPT_SALT_ROUNDS=12

JWT_ACCESS_SECRET="your_jwt_access_secret"
JWT_ACCESS_EXPIRES_IN="365d"
JWT_REFRESH_SECRET="your_jwt_refresh_secret"
JWT_REFRESH_EXPIRES_IN="30d"

REDIS_URL="redis://default:password@host:port"

# SMTP Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
SENDER_EMAIL="your_email@gmail.com"

# SSLCommerz Configuration
SSL_STORE_ID="your_ssl_store_id"
SSL_STORE_PASSWORD="your_ssl_store_password"
SSL_IS_LIVE=false
SSL_SUCCESS_URL="http://localhost:5000/api/v1/payments/confirm"
SSL_FAIL_URL="http://localhost:5000/api/v1/payments/fail"
SSL_CANCEL_URL="http://localhost:5000/api/v1/payments/cancel"
FRONTEND_URL="http://localhost:3000"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

---

## 🚀 Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/nafi0123/smart-parking-and-garage-management-system.git
cd smart-parking-and-garage-management-system/backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Sync database with Prisma
```bash
npx prisma db push
npx prisma generate
```

### 4. Run development server
```bash
npm run dev
```

Server will start on `http://localhost:5000`.

### 5. Run Prisma Studio
```bash
npx prisma studio
```

---

## 🧪 Code Quality & Build

```bash
# Run Biome Linter
npm run lint

# Auto-fix linting & formatting issues
npm run lint:fix

# Typecheck and build production bundle
npm run build
```

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
