import mongoose from "mongoose";
import { IAIInventoryBalanceItem, AIInventoryBalanceStatus } from "./inventory-balances.types";

const { Schema, model } = mongoose;

const aiInventoryBalanceSchema = new Schema<IAIInventoryBalanceItem>(
  {
    media: {
      id: {
        type: Schema.Types.ObjectId,
        ref: "media",
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity_details: {
      type: String,
      required: true,
      trim: true,
    },
    inventory_id: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: false,
    },
    status: {
      type: String,
      enum: Object.values(AIInventoryBalanceStatus),
      default: AIInventoryBalanceStatus.PENDING,
      required: true,
    },
    isDeleted: { type: Boolean, required: false, default: false },
    deletedAt: { type: Date, required: false, default: null },
  },
  {
    timestamps: true,
    collection: "ai_inventory_balances",
  }
);

aiInventoryBalanceSchema.index({ status: 1, isDeleted: 1 });
aiInventoryBalanceSchema.index({ "media.id": 1 });

export default model<IAIInventoryBalanceItem>("AIInventoryBalanceItem", aiInventoryBalanceSchema);

