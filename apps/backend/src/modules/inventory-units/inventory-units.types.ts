import mongoose from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;

export interface IInventoryUnitDefinition {
  _id: ObjectId;
  name: string;
  plural: string;
  order?: number;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Shape used for request bodies (client-provided data)
export type IInventoryUnitDefinitionRequest = Omit<
  IInventoryUnitDefinition,
  "_id" | "createdAt" | "updatedAt"
>;
