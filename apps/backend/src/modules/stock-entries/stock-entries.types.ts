import mongoose from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;

export type StockOperationType = "add" | "reduce";

export interface IStockSupplierSnapshot {
  supplierId: ObjectId;
  name: string;
}

export interface IStockEntry {
  _id: ObjectId;
  inventoryItemId: ObjectId;
  operationType: StockOperationType;
  supplier: IStockSupplierSnapshot | null;
  costPrice: number;
  sellingPrice: number;
  expiryDate: Date;
  quantityInBaseUnits: number;
  createdBy: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Shape used for request bodies (client-provided data)
export type StockEntryRequest = Omit<
  IStockEntry,
  "_id" | "createdBy" | "createdAt" | "updatedAt"
>;
