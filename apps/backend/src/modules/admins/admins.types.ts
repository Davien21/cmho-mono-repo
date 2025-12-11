import mongoose from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;

export type AdminStatus = "active" | "inactive" | "deleted";

export enum AdminRole {
  INVENTORY_MANAGER = "INVENTORY_MANAGER",
  INVENTORY_EDITOR = "INVENTORY_EDITOR",
}

export interface IAdmin {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  isSuperAdmin: boolean;
  roles: AdminRole[];
  status: AdminStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAdminLogin {
  email: string;
  password: string;
}
