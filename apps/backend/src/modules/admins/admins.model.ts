import mongoose from "mongoose";
import { AdminRole, IAdmin } from "./admins.types";

const { Schema, model } = mongoose;

const adminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    isSuperAdmin: { type: Boolean, required: true, default: false },
    roles: {
      type: [String],
      enum: Object.values(AdminRole),
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      required: true,
      default: "active",
    },
  },
  {
    timestamps: true,
    collection: "admins",
  }
);

export default model<IAdmin>("Admin", adminSchema);
