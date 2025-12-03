import { model, Schema } from "mongoose";
import { IMedia } from "./media.types";

const mediaSchema = new Schema<IMedia>(
  {
    url: { type: String, default: null },
    size: { type: Number },
    type: { type: String },
    public_id: { type: String },
    filename: { type: String },
    duration: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
  }
);
export default model("media", mediaSchema);
