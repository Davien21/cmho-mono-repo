import mongoose from "mongoose";
import {
  ITransaction,
  TransactionStatus,
  PaystackMeta,
} from "./transactions.types";

const { Schema, model } = mongoose;

// PaystackMeta Schema
const paystackMetaSchema = new Schema<PaystackMeta>(
  {
    webhookProcessed: {
      type: Boolean,
      default: false,
      required: true,
    },
    webhookReceivedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

// Transaction Schema
export const transactionSchema = new Schema<ITransaction>(
  {
    amountInKobo: {
      type: Number,
      required: true,
    },
    transfer: {
      type: Schema.Types.ObjectId,
      ref: "Transfer",
      required: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    paystackTxReference: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      required: true,
    },
    paystackMeta: {
      type: paystackMetaSchema,
      default: () => ({}),
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction = model<ITransaction>(
  "Transaction",
  transactionSchema
);
