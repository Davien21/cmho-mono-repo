import mongoose from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;

export interface IInventoryCategory {
  _id: ObjectId;
  name: string;
  unitPresetIds?: ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Shape used for request bodies (client-provided data)
export type IInventoryCategoryRequest = Omit<
  IInventoryCategory,
  "_id" | "createdAt" | "updatedAt"
>;
