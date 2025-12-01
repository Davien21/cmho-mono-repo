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
