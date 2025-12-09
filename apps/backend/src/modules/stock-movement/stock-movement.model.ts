import mongoose from "mongoose";
import { IStockMovement, IStockSupplierSnapshot } from "./stock-movement.types";

const { Schema, model } = mongoose;

const stockSupplierSnapshotSchema = new Schema<IStockSupplierSnapshot>(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const stockMovementSchema = new Schema<IStockMovement>(
  {
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    operationType: {
      type: String,
      enum: ["add", "reduce"],
      required: true,
    },
    supplier: {
      type: stockSupplierSnapshotSchema,
      required: false,
      default: null,
    },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    quantityInBaseUnits: { type: Number, required: true },
    balance: { type: Number, required: false },
    performerId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    performerName: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    collection: "stock_movements",
  }
);

stockMovementSchema.index({ inventoryItemId: 1, createdAt: -1 });
stockMovementSchema.index({ createdAt: -1 });

export default model<IStockMovement>("StockMovement", stockMovementSchema);
