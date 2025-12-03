import { Document } from "mongoose";
import Admin from "./admins.model";
import { IAdmin } from "./admins.types";

type AdminDocument = IAdmin & Document;

class AdminService {
  findByEmail(email: string): Promise<AdminDocument | null> {
    return Admin.findOne({ email }) as Promise<AdminDocument | null>;
  }

  findById(id: string): Promise<AdminDocument | null> {
    return Admin.findById(id) as Promise<AdminDocument | null>;
  }

  getAdmins({
    sort = 1,
    limit = 10,
    page = 1,
  }: {
    sort?: 1 | -1;
    limit?: number;
    page?: number;
  }) {
    const skip = (page - 1) * limit;

    return Admin.find({ status: { $ne: "deleted" } })
      .select("-passwordHash")
      .sort({ _id: sort })
      .limit(limit)
      .skip(skip)
      .lean();
  }

  create(admin: Omit<IAdmin, "_id" | "createdAt" | "updatedAt">) {
    return Admin.create(admin);
  }

  update(id: string, updateQuery: Partial<Omit<IAdmin, "_id">>) {
    return Admin.findByIdAndUpdate(id, updateQuery, { new: true });
  }
}

export default new AdminService();


