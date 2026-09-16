export interface ISSLCommerzInitPayload {
  amount: number;
  transactionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  productName?: string;
}

export interface ISSLCommerzCallbackPayload {
  tran_id: string;
  val_id?: string;
  amount?: string;
  card_type?: string;
  store_amount?: string;
  bank_tran_id?: string;
  status?: string;
  currency?: string;
  error?: string;
  [key: string]: any;
}
