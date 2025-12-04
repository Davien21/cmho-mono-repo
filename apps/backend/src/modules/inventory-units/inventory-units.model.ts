import mongoose from "mongoose";
import { IInventoryUnitDefinition } from "./inventory-units.types";

const { Schema, model } = mongoose;

const inventoryUnitSchema = new Schema<IInventoryUnitDefinition>(
  {
    name: { type: String, required: true, trim: true },
    plural: { type: String, required: true, trim: true },
    order: { type: Number, required: false, default: 0 },
    isDeleted: { type: Boolean, required: false, default: false },
    deletedAt: { type: Date, required: false, default: null },
  },
  {
    timestamps: true,
    collection: "inventory_units",
  }
);

export default model<IInventoryUnitDefinition>(
  "InventoryUnit",
  inventoryUnitSchema
);
