import mongoose from "mongoose";
import {
  ITriggerNotification,
  NotificationStatus,
  NotificationPriority,
} from "./notifications.types";

const { Schema, model } = mongoose;

const triggerNotificationSchema = new Schema<ITriggerNotification>(
  {
    type: { type: String, required: true, trim: true, index: true },
    module: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      enum: ["active", "resolved"],
      required: true,
      default: "active",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["HIGH", "MED", "LOW"],
      required: true,
    },
    metadata: { type: Schema.Types.Mixed, required: true, default: {} },
  },
  {
    timestamps: true,
    collection: "trigger_notifications",
  }
);

// Create indexes for efficient querying
triggerNotificationSchema.index({ "metadata.inventoryId": 1, type: 1, status: 1 }); // Find active notification by inventoryId and type
triggerNotificationSchema.index({ module: 1, status: 1, updatedAt: -1 }); // Module-specific active notifications
triggerNotificationSchema.index({ status: 1, updatedAt: -1 }); // All active notifications sorted by updatedAt
triggerNotificationSchema.index({ type: 1, status: 1, updatedAt: -1 }); // Type-specific notifications
triggerNotificationSchema.index({ updatedAt: -1 }); // Most recent notifications first

export default model<ITriggerNotification>(
  "TriggerNotification",
  triggerNotificationSchema
);

