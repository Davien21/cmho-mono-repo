import mongoose from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;

export type StockOperationType = "add" | "reduce";

export interface IStockSupplierSnapshot {
  supplierId: ObjectId;
  name: string;
}

export interface IStockMovement {
  _id: ObjectId;
  inventoryItemId: ObjectId;
  operationType: StockOperationType;
  supplier: IStockSupplierSnapshot | null;
  costPrice: number;
  sellingPrice: number;
  expiryDate: Date;
  quantityInBaseUnits: number;
  balance?: number;
  performerId: ObjectId;
  performerName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Shape used for request bodies (client-provided data)
// For reduce operations, costPrice, sellingPrice, and expiryDate are optional
export type StockMovementRequest = Omit<
  IStockMovement,
  "_id" | "performerId" | "performerName" | "createdAt" | "updatedAt"
> & {
  costPrice?: number;
  sellingPrice?: number;
  expiryDate?: Date;
};

