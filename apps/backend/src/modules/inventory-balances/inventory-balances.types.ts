import mongoose from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;

export enum AIInventoryBalanceStatus {
  PENDING = "pending",
  SYNCED = "synced",
}

export interface IAIInventoryBalanceItem {
  _id: ObjectId;
  media: {
    id: ObjectId;
    url: string;
  };
  name: string;
  quantity_details: string;
  inventory_id?: ObjectId;
  status: AIInventoryBalanceStatus;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAIInventoryBalanceRequest {
  media_id: string;
  imageUrl: string;
  items: Array<{
    name: string;
    quantity_details: string;
  }>;
}

