import mongoose from "mongoose";
import { ETransferType } from "../../lib/interfaces";
export type ObjectId = mongoose.Types.ObjectId;

export enum TransferStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  REVERSED = "reversed",
}

export interface ITransfer {
  _id: ObjectId;
  amountInKobo: number;
  type: ETransferType;
  transactionCount: number;
}
