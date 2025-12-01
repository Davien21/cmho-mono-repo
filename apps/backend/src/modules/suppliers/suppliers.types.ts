import mongoose from 'mongoose';

export type ObjectId = mongoose.Types.ObjectId;

export type SupplierStatus = 'active' | 'disabled' | 'deleted';

export interface ISupplier {
  _id: ObjectId;
  name: string;
  contact?: {
    phone?: string;
    address?: string;
  };
  status: SupplierStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Shape used for request bodies (client-provided data)
export type SupplierRequest = Omit<ISupplier, '_id' | 'createdAt' | 'updatedAt'>;
