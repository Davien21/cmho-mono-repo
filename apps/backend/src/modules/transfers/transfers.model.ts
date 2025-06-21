import mongoose from "mongoose";
import { ITransfer } from "./transfers.types";
import { ETransferType } from "../../lib/interfaces";

const { Schema, model } = mongoose;

// Transfer Schema
const transferSchema = new Schema<ITransfer>(
  {
    amountInKobo: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(ETransferType),
      default: ETransferType.SINGLE,
      required: true,
    },
    transactionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Transfer = model<ITransfer>("Transfer", transferSchema);
