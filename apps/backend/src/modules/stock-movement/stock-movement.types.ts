import mongoose from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;

export type StockOperationType = "add" | "reduce";

export interface IStockSupplierSnapshot {
  supplierId: ObjectId;
  name: string;
}

export interface IInventoryItemStockMovementSnapshot {
  id: ObjectId;
  name: string;
}

export interface IPerformerStockMovementSnapshot {
  id: ObjectId;
  name: string;
}

export interface IPriceStockMovementSnapshot {
  costPrice: number;
  sellingPrice: number;
}

export interface IStockMovement {
  _id: ObjectId;
  inventoryItem: IInventoryItemStockMovementSnapshot;
  operationType: StockOperationType;
  supplier: IStockSupplierSnapshot | null;
  prices: IPriceStockMovementSnapshot | null;
  expiryDate: Date;
  quantityInBaseUnits: number;
  balance: number;
  performer: IPerformerStockMovementSnapshot;
  createdAt?: Date;
  updatedAt?: Date;
}

// Shape used for request bodies (client-provided data)
// For reduce operations, prices and expiryDate are optional
export type StockMovementRequest = Omit<
  IStockMovement,
  "_id" | "createdAt" | "updatedAt"
>;
