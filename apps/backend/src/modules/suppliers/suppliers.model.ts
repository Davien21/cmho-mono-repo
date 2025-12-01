import mongoose from "mongoose";
import { ISupplier } from "./suppliers.types";

const { Schema, model } = mongoose;

const supplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    contact: {
      phone: { type: String, required: false, trim: true },
      address: { type: String, required: false, trim: true },
    },
    status: {
      type: String,
      enum: ["active", "disabled", "deleted"],
      required: true,
      default: "active",
    },
  },
  {
    timestamps: true,
    collection: "suppliers",
  }
);

export default model<ISupplier>("Supplier", supplierSchema);
