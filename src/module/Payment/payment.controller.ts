import type { Request, Response } from 'express';
import catchAsync from '../../app/utils/catchAsync';
import sendResponse from '../../app/utils/sendResponse';
import { PaymentService } from './payment.service';

const renderHtmlStatusPage = (
  res: Response,
  options: {
    status: 'success' | 'failed' | 'cancelled';
    title: string;
    subtitle: string;
    tranId: string;
    amount?: number | string;
    garageName?: string;
  },
) => {
  const isSuccess = options.status === 'success';
  const isFailed = options.status === 'failed';
  const themeColor = isSuccess ? '#10b981' : isFailed ? '#ef4444' : '#f59e0b';
  const icon = isSuccess ? '✓' : isFailed ? '✕' : '!';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title} | Smart Parking System</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 1rem;
      max-width: 480px;
      width: 100%;
      padding: 2.5rem 2rem;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }
    .badge-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: ${themeColor}22;
      color: ${themeColor};
      border: 2px solid ${themeColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: bold;
      margin: 0 auto 1.5rem auto;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.5rem;
    }
    p.subtitle {
      color: #94a3b8;
      font-size: 0.95rem;
      margin-bottom: 1.75rem;
      line-height: 1.5;
    }
    .details {
      background: #0f172a;
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin-bottom: 1.75rem;
      text-align: left;
      font-size: 0.9rem;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #1e293b;
    }
    .details-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #64748b;
    }
    .value {
      font-weight: 600;
      color: #e2e8f0;
    }
    .footer-note {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge-icon">${icon}</div>
    <h1>${options.title}</h1>
    <p class="subtitle">${options.subtitle}</p>

    <div class="details">
      <div class="details-row">
        <span class="label">Transaction ID</span>
        <span class="value">${options.tranId}</span>
      </div>
      ${
        options.garageName
          ? `<div class="details-row">
        <span class="label">Garage</span>
        <span class="value">${options.garageName}</span>
      </div>`
          : ''
      }
      ${
        options.amount
          ? `<div class="details-row">
        <span class="label">Amount Paid</span>
        <span class="value">৳ ${options.amount} BDT</span>
      </div>`
          : ''
      }
      <div class="details-row">
        <span class="label">Payment Status</span>
        <span class="value" style="color: ${themeColor}; text-transform: uppercase;">${options.status}</span>
      </div>
    </div>

    <p class="footer-note">Smart Parking & Garage Management System</p>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(isSuccess ? 200 : isFailed ? 400 : 200).send(html);
};

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.confirmPayment(req.body);

  // If request expects JSON or API response
  if (req.headers.accept?.includes('application/json')) {
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Payment confirmed and parking slot reserved successfully',
      data: result,
    });
    return;
  }

  // Render HTML receipt for browser redirect
  renderHtmlStatusPage(res, {
    status: 'success',
    title: 'Payment Successful!',
    subtitle: 'Your parking slot has been reserved. Available slots have been updated.',
    tranId: result.payment.transactionId,
    amount: result.payment.amount,
    garageName: result.garage.name,
  });
});

const failPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.failPayment(req.body);

  if (req.headers.accept?.includes('application/json')) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Payment failed. Parking slot was not reserved.',
      data: result,
    });
    return;
  }

  renderHtmlStatusPage(res, {
    status: 'failed',
    title: 'Payment Failed',
    subtitle: 'Your payment could not be completed. Parking slot has not been decremented.',
    tranId: result.payment.transactionId,
    amount: result.payment.amount,
    garageName: result.garage.name,
  });
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.cancelPayment(req.body);

  if (req.headers.accept?.includes('application/json')) {
    sendResponse(res, {
      statusCode: 200,
      success: false,
      message: 'Payment was cancelled. Parking slot was not reserved.',
      data: result,
    });
    return;
  }

  renderHtmlStatusPage(res, {
    status: 'cancelled',
    title: 'Payment Cancelled',
    subtitle: 'You cancelled the payment process. No slots were decremented.',
    tranId: result.payment.transactionId,
    amount: result.payment.amount,
    garageName: result.garage.name,
  });
});

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const userId = (req as any).user.userId;
  const result = await PaymentService.initiatePaymentForBooking(bookingId as string, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment initiated successfully',
    data: result,
  });
});

export const PaymentController = {
  confirmPayment,
  failPayment,
  cancelPayment,
  initiatePayment,
};
