export interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at?: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address?: string;
    metadata?: any;
    fees_breakdown?: any;
    log?: any;
    fees?: number;
    fees_split?: any;
    authorization?: any;
    customer?: any;
    plan?: any;
    split?: any;
    order_id?: any;
    paidAt?: string;
    createdAt: string;
    requested_amount?: number;
    pos_transaction_data?: any;
    source?: any;
    fees_charged?: number;
    reason?: string;
    recipient?: {
      active: boolean;
      currency: string;
      description?: string;
      domain: string;
      email?: string;
      id: number;
      integration: number;
      metadata?: any;
      name: string;
      recipient_code: string;
      type: string;
      is_deleted: boolean;
      isDeleted: boolean;
      details: {
        authorization_code?: string;
        account_number?: string;
        account_name?: string;
        bank_code?: string;
        bank_name?: string;
      };
      created_at: string;
      updated_at: string;
    };
  };
}

export interface PaystackWebhookValidation {
  isValid: boolean;
  error?: string;
}

export enum PaystackTransferEvents {
  TRANSFER_SUCCESS = 'transfer.success',
  TRANSFER_FAILED = 'transfer.failed',
  TRANSFER_REVERSED = 'transfer.reversed',
}
