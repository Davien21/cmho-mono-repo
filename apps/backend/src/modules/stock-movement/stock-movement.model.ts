import mongoose from "mongoose";
import {
  IInventoryItemStockMovementSnapshot,
  IPerformerStockMovementSnapshot,
  IPriceStockMovementSnapshot,
  IStockMovement,
  IStockSupplierSnapshot,
} from "./stock-movement.types";

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

const inventoryItemSnapshotSchema =
  new Schema<IInventoryItemStockMovementSnapshot>(
    {
      id: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
      name: { type: String, required: true, trim: true },
    },
    { _id: false }
  );

const performerSnapshotSchema = new Schema<IPerformerStockMovementSnapshot>(
  {
    id: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const priceSnapshotSchema = new Schema<IPriceStockMovementSnapshot>(
  {
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
  },
  { _id: false }
);

const stockMovementSchema = new Schema<IStockMovement>(
  {
    inventoryItem: { type: inventoryItemSnapshotSchema, required: true },
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
    prices: { type: priceSnapshotSchema, required: false, default: null },
    expiryDate: { type: Date, required: true },
    quantityInBaseUnits: { type: Number, required: true },
    balance: { type: Number, required: true },
    performer: {
      type: performerSnapshotSchema,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "stock_movements",
  }
);

stockMovementSchema.index({ "inventoryItem.id": 1, createdAt: -1 });
stockMovementSchema.index({ createdAt: -1 });

export default model<IStockMovement>("StockMovement", stockMovementSchema);
