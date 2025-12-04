import mongoose from "mongoose";
import { IInventoryCategory } from "./inventory-categories.types";

const { Schema, model } = mongoose;

const inventoryCategorySchema = new Schema<IInventoryCategory>(
  {
    name: { type: String, required: true, trim: true },
    unitPresetIds: {
      type: [Schema.Types.ObjectId],
      ref: "InventoryUnit",
      required: false,
      default: [],
    },
    canBeSold: {
      type: Boolean,
      required: false,
      default: true,
    },
    order: { type: Number, required: false, default: 0 },
    isDeleted: { type: Boolean, required: false, default: false },
    deletedAt: { type: Date, required: false, default: null },
  },
  {
    timestamps: true,
    collection: "inventory_categories",
  }
);

export default model<IInventoryCategory>(
  "InventoryCategory",
  inventoryCategorySchema
);
