import mongoose from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;

export type InventorySetupStatus = "draft" | "ready";

export type InventoryStatus = "active" | "disabled" | "deleted";

// ---- Units ----

export interface IInventoryUnitBase {
  id: string;
  name: string;
  plural: string;
}

// Draft item units: can be partially specified
export interface IInventoryUnitDraft extends IInventoryUnitBase {
  presetId?: string;
  quantity?: number;
}

// Ready item units: must be fully specified
export interface IInventoryUnitReady extends IInventoryUnitBase {
  presetId: string;
  quantity: number;
}

// Convenience alias when you don't care about setupStatus
export type IInventoryUnit = IInventoryUnitDraft | IInventoryUnitReady;

// ---- Items ----

export interface IInventoryItemBase {
  _id: ObjectId;
  name: string;
  category: string;
  status: InventoryStatus;
  createdBy: ObjectId;
  currentStockInBaseUnits?: number;
  earliestExpiryDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInventoryItemDraft
  extends Omit<IInventoryItemBase, "status"> {
  setupStatus: "draft";
  status: InventoryStatus;
  units: IInventoryUnitDraft[];
  lowStockValue?: number;
}

export interface IInventoryItemReady
  extends Omit<IInventoryItemBase, "status"> {
  setupStatus: "ready";
  status: InventoryStatus;
  units: IInventoryUnitReady[];
  lowStockValue: number;
}

// Main type used when reading from the database
export type IInventoryItem = IInventoryItemDraft | IInventoryItemReady;

// Type used for request bodies (client-provided data) – server fills these
export type IInventoryItemRequest = Omit<
  IInventoryItem,
  "_id" | "createdBy" | "createdAt" | "updatedAt"
>;
