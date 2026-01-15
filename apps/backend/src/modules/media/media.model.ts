import { model, Schema } from "mongoose";
import { IMedia, MediaCategory } from "./media.types";

const mediaSchema = new Schema<IMedia>(
  {
    url: { type: String, default: null },
    size: { type: Number },
    type: { type: String },
    public_id: { type: String },
    filename: { type: String },
    category: {
      type: String,
      enum: Object.values(MediaCategory),
      default: MediaCategory.INVENTORY,
      required: true,
    },
    duration: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
  }
);

mediaSchema.index({ category: 1 });
mediaSchema.index({ public_id: 1 }, { unique: true });

export default model("media", mediaSchema);
