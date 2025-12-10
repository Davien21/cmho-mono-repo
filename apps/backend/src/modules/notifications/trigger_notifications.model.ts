import mongoose from "mongoose";
import {
  ITriggerNotification,
  NotificationStatus,
  NotificationPriority,
  NotificationType,
  NotificationModule,
} from "./trigger_notifications.types";

const { Schema, model } = mongoose;

const triggerNotificationSchema = new Schema<ITriggerNotification>(
  {
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      trim: true,
    },
    module: {
      type: String,
      enum: Object.values(NotificationModule),
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      required: true,
      default: NotificationStatus.ACTIVE,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
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
triggerNotificationSchema.index({
  "metadata.inventoryId": 1,
  type: 1,
  status: 1,
}); // Find active notification by inventoryId and type
triggerNotificationSchema.index({ module: 1, status: 1, updatedAt: -1 }); // Module-specific active notifications

export default model<ITriggerNotification>(
  "TriggerNotification",
  triggerNotificationSchema
);
