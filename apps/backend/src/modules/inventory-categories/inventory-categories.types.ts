import mongoose from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;

export interface IInventoryCategory {
  _id: ObjectId;
  name: string;
  unitPresetIds?: ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInventoryCategoryUnitPresetPopulated {
  _id: ObjectId;
  name: string;
  plural: string;
}

export interface IInventoryCategoryWithUnitPresetsPopulated
  extends Omit<IInventoryCategory, "unitPresetIds"> {
  /**
   * Normalized array of unit preset ids as strings,
   * convenient for clients that don't want to deal with ObjectId.
   */
  unitPresetIds?: string[];
  /**
   * Populated unit preset documents.
   */
  unitPresets?: IInventoryCategoryUnitPresetPopulated[];
}

// Shape used for request bodies (client-provided data)
export type IInventoryCategoryRequest = Omit<
  IInventoryCategory,
  "_id" | "createdAt" | "updatedAt"
>;
