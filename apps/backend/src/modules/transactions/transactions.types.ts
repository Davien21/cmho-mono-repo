import mongoose from "mongoose";
import { IEmployeeWithBank } from "../employees/employees.types";
import { ITransfer } from "../transfers/transfers.types";

export type ObjectId = mongoose.Types.ObjectId;

export enum TransactionStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  REVERSED = "reversed",
}

export interface PaystackMeta {
  webhookProcessed: boolean;
  webhookReceivedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
}

export interface ITransaction {
  _id: ObjectId;
  amountInKobo: number;
  transfer: ObjectId | ITransfer;
  employee: ObjectId | IEmployeeWithBank;
  paystackTxReference: string;
  status: TransactionStatus;
  paystackMeta: PaystackMeta;
}
