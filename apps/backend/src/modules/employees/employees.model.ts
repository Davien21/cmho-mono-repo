import mongoose from "mongoose";
import { IEmployee } from "./employees.types";

const { Schema, model } = mongoose;

const bankSchema = new Schema(
  {
    bank_id: { type: Number, required: true, trim: true },
    bank_name: { type: String, required: true, trim: true },
    account_name: { type: String, required: true, trim: true },
    account_number: { type: String, required: true, trim: true },
    bank_code: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const employeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true },
    salary: { type: Number, required: true },
    position: { type: String, required: true, trim: true },
    bank: {
      type: bankSchema,
      default: null,
    },
    last_paid_on: { type: Date, default: null },
    paystack_recipient_code: { type: String, default: null },
    isDeleted: { type: Boolean, required: false, default: false },
    deletedAt: { type: Date, required: false, default: null },
  },
  { timestamps: true }
);

export default model<IEmployee>("Employee", employeeSchema);
