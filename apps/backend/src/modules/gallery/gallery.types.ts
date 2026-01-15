import mongoose from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;

export enum GalleryCategory {
  INVENTORY = "inventory",
  BALANCES = "balance_sheet",
  STOCK_UPDATES = "stock_update",
}

export interface IGallery {
  _id: ObjectId;
  media_id: ObjectId;
  name?: string;
  imageUrl?: string;
  category: GalleryCategory;
  isDeleted?: boolean;
  deletedAt?: Date;
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

