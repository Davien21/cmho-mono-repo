import mongoose from 'mongoose';
import { IStockEntry, IStockSupplierSnapshot } from './stock-entries.types';

const { Schema, model } = mongoose;

const stockSupplierSnapshotSchema = new Schema<IStockSupplierSnapshot>(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const stockEntrySchema = new Schema<IStockEntry>(
  {
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
    },
    operationType: {
      type: String,
      enum: ['add', 'reduce'],
      required: true,
    },
    supplier: {
      type: stockSupplierSnapshotSchema,
      required: false,
      default: null,
    },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    quantityInBaseUnits: { type: Number, required: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'stock_entries',
  }
);

stockEntrySchema.index({ inventoryItemId: 1, createdAt: -1 });
stockEntrySchema.index({ createdAt: -1 });

export default model<IStockEntry>('StockEntry', stockEntrySchema);
