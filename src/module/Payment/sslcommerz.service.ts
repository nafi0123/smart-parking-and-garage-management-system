import AppError from '../../app/errors/AppError';
import type { ISSLCommerzInitPayload } from './payment.interface';

const isLive = process.env.SSL_IS_LIVE === 'true';
const storeId = process.env.SSL_STORE_ID || '';
const storePasswd = process.env.SSL_STORE_PASSWORD || '';

const getBaseUrl = () =>
  isLive ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com';

const initPayment = async (payload: ISSLCommerzInitPayload): Promise<string> => {
  if (!storeId || !storePasswd) {
    throw new AppError(500, 'SSLCommerz credentials not configured in environment!');
  }

  const sslUrl = `${getBaseUrl()}/gwprocess/v4/api.php`;

  const params = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePasswd,
    total_amount: payload.amount.toString(),
    currency: 'BDT',
    tran_id: payload.transactionId,
    success_url: process.env.SSL_SUCCESS_URL || 'http://localhost:5000/api/v1/payments/confirm',
    fail_url: process.env.SSL_FAIL_URL || 'http://localhost:5000/api/v1/payments/fail',
    cancel_url: process.env.SSL_CANCEL_URL || 'http://localhost:5000/api/v1/payments/cancel',
    ipn_url: process.env.SSL_SUCCESS_URL || 'http://localhost:5000/api/v1/payments/confirm',
    shipping_method: 'NO',
    product_name: payload.productName || 'Smart Parking Slot',
    product_category: 'Parking',
    product_profile: 'general',
    cus_name: payload.customerName || 'Customer',
    cus_email: payload.customerEmail || 'customer@example.com',
    cus_add1: payload.customerAddress || 'Dhaka',
    cus_city: 'Dhaka',
    cus_country: 'Bangladesh',
    cus_phone: payload.customerPhone || '01700000000',
  });

  const response = await fetch(sslUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new AppError(502, `SSLCommerz gateway error: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    status: string;
    failedreason?: string;
    GatewayPageURL?: string;
  };

  if (data.status !== 'SUCCESS' || !data.GatewayPageURL) {
    throw new AppError(
      400,
      data.failedreason || 'Failed to initialize SSLCommerz payment session!',
    );
  }

  return data.GatewayPageURL;
};

const validatePayment = async (val_id: string) => {
  if (!storeId || !storePasswd) {
    throw new AppError(500, 'SSLCommerz credentials not configured in environment!');
  }

  const validationUrl = `${getBaseUrl()}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(
    val_id,
  )}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(
    storePasswd,
  )}&v=1&format=json`;

  const response = await fetch(validationUrl, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new AppError(502, 'SSLCommerz validation server unreachable!');
  }

  const result = (await response.json()) as {
    status: string;
    val_id?: string;
    tran_id?: string;
    amount?: string;
    bank_tran_id?: string;
    card_type?: string;
    [key: string]: any;
  };

  return result;
};

const initiateRefund = async (params: {
  bank_tran_id: string;
  refund_amount: number;
  refund_remarks: string;
  re_fe_id: string;
}) => {
  if (!storeId || !storePasswd) {
    throw new AppError(500, 'SSLCommerz credentials not configured in environment!');
  }

  const refundUrl = `${getBaseUrl()}/validator/api/merchantTransIDvalidationAPI.php?refund_amount=${encodeURIComponent(
    params.refund_amount.toString(),
  )}&refund_remarks=${encodeURIComponent(params.refund_remarks)}&bank_tran_id=${encodeURIComponent(
    params.bank_tran_id,
  )}&re_fe_id=${encodeURIComponent(
    params.re_fe_id,
  )}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(
    storePasswd,
  )}&v=1&format=json`;

  const response = await fetch(refundUrl, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new AppError(502, 'SSLCommerz refund service unreachable!');
  }

  const result = (await response.json()) as {
    status: string;
    refund_ref_id?: string;
    errorReason?: string;
    [key: string]: any;
  };

  return result;
};

export const SSLCommerzService = {
  initPayment,
  validatePayment,
  initiateRefund,
};
