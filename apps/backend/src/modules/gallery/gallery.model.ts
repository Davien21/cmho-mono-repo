import mongoose from "mongoose";
import { IGallery } from "./gallery.types";

const { Schema, model } = mongoose;

const gallerySchema = new Schema<IGallery>(
  {
    media_id: {
      type: Schema.Types.ObjectId,
      ref: "media",
      required: true,
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    isDeleted: { type: Boolean, required: false, default: false },
    deletedAt: { type: Date, required: false, default: null },
  },
  {
    timestamps: true,
    collection: "gallery",
  }
);

export default model<IGallery>("Gallery", gallerySchema);

