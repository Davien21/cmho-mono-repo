import axios, { AxiosResponse } from "axios";
import { env } from "../config/env";
import {
  IAPIResponse,
  PaystackTransferRecipient,
  PaystackTransferResponse,
  PaystackBulkTransferResponse,
  TransferRecipient,
  SingleTransferRequest,
  BankAccountVerificationResult,
  PaystackBankDetails,
} from "./interfaces";

const { PAYSTACK_SECRET_KEY } = env;

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const paystackHeaders = {
  Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  "Content-Type": "application/json",
};

class PaystackClient {
  /**
   * Create a transfer recipient
   */
  async createTransferRecipient(
    recipient: TransferRecipient
  ): Promise<PaystackTransferRecipient> {
    const response: AxiosResponse<IAPIResponse<PaystackTransferRecipient>> =
      await axios.post(`${PAYSTACK_BASE_URL}/transferrecipient`, recipient, {
        headers: paystackHeaders,
      });

    return response.data.data;
  }

  /**
   * Initiate a single transfer
   */
  async initiateTransfer(
    transfer: SingleTransferRequest
  ): Promise<PaystackTransferResponse> {
    const transferPayload = {
      source: "balance",
      amount: transfer.amountInKobo,
      recipient: transfer.recipient_code,
      reason: transfer.reason,
      reference: transfer.reference,
    };

    const response: AxiosResponse<IAPIResponse<PaystackTransferResponse>> =
      await axios.post(`${PAYSTACK_BASE_URL}/transfer`, transferPayload, {
        headers: paystackHeaders,
      });

    return response.data.data;
  }

  /**
   * Initiate bulk transfers
   */
  async initiateBulkTransfers(
    transfers: SingleTransferRequest[]
  ): Promise<PaystackBulkTransferResponse> {
    // Create recipients for all transfers
    const transfersWithRecipients = await Promise.all(
      transfers.map(async (transfer) => {
        return {
          amount: transfer.amountInKobo,
          recipient: transfer.recipient_code,
          reason: transfer.reason,
          reference: transfer.reference,
        };
      })
    );

    const bulkTransferPayload = {
      source: "balance",
      transfers: transfersWithRecipients,
    };

    const response: AxiosResponse<IAPIResponse<PaystackBulkTransferResponse>> =
      await axios.post(
        `${PAYSTACK_BASE_URL}/transfer/bulk`,
        bulkTransferPayload,
        {
          headers: paystackHeaders,
        }
      );

    return response.data.data;
  }

  /**
   * Get account balances from Paystack
   */
  async getAccountBalances(): Promise<
    {
      currency: string;
      balance: number;
    }[]
  > {
    const response = await axios.get(`${PAYSTACK_BASE_URL}/balance`, {
      headers: paystackHeaders,
    });

    return response.data.data;
  }

  /**
   * Validate Bank account details
   */
  async validateBank(accountNumber: string, bankCode: string) {
    const response = await axios.get<
      AxiosResponse<BankAccountVerificationResult>
    >("https://api.paystack.co/bank/resolve", {
      params: { account_number: accountNumber, bank_code: bankCode },
      headers: paystackHeaders,
    });

    return response.data.data;
  }

  /**
   * Get all Nigerian banks
   */
  async getNigerianBanks() {
    const response = await axios.get<IAPIResponse<PaystackBankDetails[]>>(
      "https://api.paystack.co/bank",
      {
        params: { country: "nigeria", type: "nuban" },
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data;
  }
}

export default new PaystackClient();
