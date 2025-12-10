import mongoose from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;

export type InventoryStatus = "active" | "disabled" | "deleted";

// ---- Units ----

export interface IInventoryUnitBase {
  id: ObjectId;
  name: string;
  plural: string;
}

// Draft item units: can be partially specified
export interface IInventoryUnitDraft extends IInventoryUnitBase {
  quantity?: number;
}

// Ready item units: must be fully specified
export interface IInventoryUnitReady extends IInventoryUnitBase {
  quantity: number;
}

// Convenience alias
export type IInventoryUnit = IInventoryUnitDraft | IInventoryUnitReady;

// ---- Items ----

export interface IInventoryItemImage {
  url: string;
  mediaId: string;
}

export interface IInventoryCategory {
  _id: ObjectId;
  name: string;
}

export interface IInventoryItemBase {
  _id: ObjectId;
  name: string;
  category: IInventoryCategory;
  status: InventoryStatus;
  createdBy: ObjectId;
  currentStockInBaseUnits?: number;
  image?: IInventoryItemImage;
  canBeSold?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInventoryItem extends IInventoryItemBase {
  status: InventoryStatus;
  units: IInventoryUnit[];
  lowStockValue?: number;
}

// Type used for request bodies (client-provided data) – server fills these
export type IInventoryItemRequest = Omit<
  IInventoryItem,
  "_id" | "createdBy" | "createdAt" | "updatedAt"
>;
