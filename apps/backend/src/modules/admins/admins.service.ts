import { Document } from "mongoose";
import Admin from "./admins.model";
import { IAdmin } from "./admins.types";

type AdminDocument = IAdmin & Document;

class AdminService {
  findByEmail(email: string): Promise<AdminDocument | null> {
    return Admin.findOne({ email }) as Promise<AdminDocument | null>;
  }
}

export default new AdminService();


