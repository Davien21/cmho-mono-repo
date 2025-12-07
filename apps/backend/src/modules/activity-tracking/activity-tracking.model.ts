import mongoose from "mongoose";
import { IActivityRecord } from "./activity-tracking.types";

const { Schema, model } = mongoose;

const activityRecordSchema = new Schema<IActivityRecord>(
  {
    type: { type: String, required: true, trim: true, index: true },
    module: { type: String, required: true, trim: true, index: true },
    entities: [
      {
        id: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
      },
    ],
    admin: {
      id: {
        type: Schema.Types.ObjectId,
        ref: "Admin",
        required: true,
        index: true,
      },
      name: { type: String, required: true, trim: true },
    },
    description: { type: String, required: true, trim: true },
    metadata: { type: Schema.Types.Mixed, required: true, default: {} },
  },
  {
    timestamps: true,
    collection: "activity_records",
  }
);

// Create indexes for efficient querying
activityRecordSchema.index({ "entities.id": 1, createdAt: -1 }); // Find all activities for an entity
activityRecordSchema.index({ "admin.id": 1, createdAt: -1 }); // Admin activity timeline
activityRecordSchema.index({ module: 1, createdAt: -1 }); // Module-specific feeds
activityRecordSchema.index({ type: 1, createdAt: -1 }); // Filter by activity type
activityRecordSchema.index({ createdAt: -1 }); // Most recent activities first

export default model<IActivityRecord>("ActivityRecord", activityRecordSchema);

