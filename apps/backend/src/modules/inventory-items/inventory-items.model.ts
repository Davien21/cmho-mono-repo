import mongoose from "mongoose";
import {
  IInventoryCategory,
  IInventoryItem,
  IInventoryItemImage,
  IInventoryUnit,
} from "./inventory-items.types";
import notificationsService from "../notifications/trigger_notifications.service";

const { Schema, model } = mongoose;

const inventoryUnitSchema = new Schema<IInventoryUnit>(
  {
    id: {
      type: Schema.Types.ObjectId,
      ref: "InventoryUnit",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    plural: { type: String, required: true, trim: true },
    quantity: { type: Number, required: false },
  },
  { _id: false }
);

const categorySchema = new Schema<IInventoryCategory>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      ref: "InventoryCategory",
      required: true,
    },
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const inventoryItemImageSchema = new Schema<IInventoryItemImage>(
  {
    url: { type: String, required: true },
    mediaId: { type: String, required: true },
  },
  { _id: false }
);

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: categorySchema,
      required: true,
    },
    units: { type: [inventoryUnitSchema], required: true },
    lowStockValue: { type: Number, required: true, default: 10 },
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
    earliestExpiryDate: {
      type: Date,
      required: false,
      default: null,
    },
    image: {
      type: inventoryItemImageSchema,
      required: false,
      default: null,
    },
    canBeSold: {
      type: Boolean,
      required: false,
      default: true,
    },
    isDeleted: { type: Boolean, required: false, default: false },
    deletedAt: { type: Date, required: false, default: null },
  },
  {
    timestamps: true,
    collection: "inventory_items",
  }
);

// Post-save hook to check stock notifications
inventoryItemSchema.post("save", async function (doc) {
  // Only check for items that are not deleted
  if (doc.isDeleted !== true && doc.status !== "deleted") {
    try {
      const currentStock = doc.currentStockInBaseUnits ?? 0;
      const lowStockValue = doc.lowStockValue;

      // Check and create/update notifications
      // Errors are caught to prevent notification failures from blocking saves
      await notificationsService.checkInventoryStockNotifications(
        doc._id.toString(),
        doc.name,
        currentStock,
        lowStockValue
      );
    } catch (error) {
      // Log error but don't fail the save operation
      console.error("Error checking stock notifications:", error);
    }
  }
});

export default model<IInventoryItem>("InventoryItem", inventoryItemSchema);
