import mongoose from "mongoose";
import { IInventoryItem, IInventoryUnit } from "./inventory-items.types";

const { Schema, model } = mongoose;

const inventoryUnitSchema = new Schema<IInventoryUnit>(
  {
    id: { type: String, required: true },
    presetId: { type: String, required: false },
    name: { type: String, required: true, trim: true },
    plural: { type: String, required: true, trim: true },
    quantity: { type: Number, required: false },
  },
  { _id: false }
);

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    units: { type: [inventoryUnitSchema], required: true },
    lowStockValue: { type: Number, required: false },
    setupStatus: {
      type: String,
      enum: ["draft", "ready"],
      required: true,
      default: "draft",
    },
    status: {
      type: String,
      enum: ["active", "disabled", "deleted"],
      required: true,
      default: "active",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    currentStockInBaseUnits: {
      type: Number,
      required: false,
      default: 0,
    },
    image: {
      url: { type: String, required: false },
      mediaId: { type: String, required: false },
      _id: false,
    },
    canBeSold: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "inventory_items",
  }
);

export default model<IInventoryItem>("InventoryItem", inventoryItemSchema);
