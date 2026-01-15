import mongoose from "mongoose";
import { IGallery, GalleryCategory } from "./gallery.types";

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
    category: {
      type: String,
      enum: Object.values(GalleryCategory),
      default: GalleryCategory.INVENTORY,
      required: true,
    },
    isDeleted: { type: Boolean, required: false, default: false },
    deletedAt: { type: Date, required: false, default: null },
  },
  {
    timestamps: true,
    collection: "gallery",
  }
);

gallerySchema.index({ category: 1, isDeleted: 1 });

export default model<IGallery>("Gallery", gallerySchema);

