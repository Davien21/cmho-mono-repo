import mongoose from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;

export interface IGallery {
  _id: ObjectId;
  media_id: ObjectId;
  name?: string;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Shape used for request bodies (client-provided data)
export type GalleryRequest = Omit<
  IGallery,
  "_id" | "media_id" | "createdAt" | "updatedAt"
> & {
  name?: string;
};

