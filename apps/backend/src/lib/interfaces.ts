export interface IEmail {
  to: string;
  from: string;
  html: string;
  subject: string;
}

export interface IBank {
  bank_name: string;
  bank_code: string;
}

export interface IAPIResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface BankAccountVerificationResult {
  account_number: string;
  account_name: string;
  bank_id: number;
}

export interface PaystackBankDetails {
  name: string;
  code: string;
  currency: string;
}

// Transfer interfaces
export interface TransferRecipient {
  type: "nuban";
  name: string;
  account_number: string;
  bank_code: string;
  currency: "NGN";
}

export interface SingleTransferRequest {
  amountInKobo: number;
  recipient: TransferRecipient;
  reason: string;
  reference: string;
  recipient_code: string;
}

export interface PaystackTransferRecipient {
  active: boolean;
  createdAt: string;
  currency: string;
  domain: string;
  id: number;
  integration: number;
  name: string;
  recipient_code: string;
  type: string;
  updatedAt: string;
  is_deleted: boolean;
  details: {
    authorization_code: string | null;
    account_number: string;
    account_name: string | null;
    bank_code: string;
    bank_name: string;
  };
}

export interface PaystackTransferResponse {
  amount: number;
  createdAt: string;
  currency: string;
  domain: string;
  failures: null;
  id: number;
  integration: number;
  reason: string;
  reference: string;
  source: string;
  source_details: null;
  status: string;
  titan_code: null;
  transfer_code: string;
  transferred_at: null;
  updatedAt: string;
  recipient: PaystackTransferRecipient;
}

export interface PaystackBulkTransferResponse {
  domain: string;
  batch_code: string;
  reference: string;
  total_amount: number;
  status: string;
  transfers: PaystackTransferResponse[];
  createdAt: string;
  updatedAt: string;
}

export enum ESortOrder {
  ASC = "asc",
  DESC = "desc",
}

export enum ETransferType {
  SINGLE = "single",
  BULK = "bulk",
}
