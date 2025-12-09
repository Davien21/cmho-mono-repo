import mongoose from "mongoose";
import { IActivityRecord } from "./activity-tracking.types";

const { Schema, model } = mongoose;

const performerSchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    userType: { type: String, required: true, default: "admin" },
  },
  { _id: false }
);

const entitySchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const activityRecordSchema = new Schema<IActivityRecord>(
  {
    type: { type: String, required: true, trim: true },
    module: { type: String, required: true, trim: true },
    entities: [entitySchema],
    performer: {
      type: performerSchema,
      required: true,
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
// Only indexes needed for actual frontend queries
activityRecordSchema.index({ module: 1, createdAt: -1 }); // Module-specific feeds with sorting
activityRecordSchema.index({ createdAt: -1 }); // General sort for unfiltered queries

export default model<IActivityRecord>("ActivityRecord", activityRecordSchema);
