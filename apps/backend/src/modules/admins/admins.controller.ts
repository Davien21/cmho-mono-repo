import { Request, Response } from "express";
import adminService from "./admins.service";
import { successResponse } from "../../utils/response";
import { NotFoundError } from "../../config/errors";
import { IAdmin } from "./admins.types";
import bcrypt from "bcrypt";

export async function getAdmins(req: Request, res: Response) {
  const { sort = "asc", limit = "10", page = "1" } = req.query;

  const admins = await adminService.getAdmins({
    sort: sort === "desc" ? -1 : 1,
    limit: parseInt(limit as string),
    page: parseInt(page as string),
  });

  res.send(successResponse("Admins fetched successfully", admins));
}

export async function createAdmin(req: Request, res: Response) {
  const { name, email, password, roles, isSuperAdmin } = req.body as {
    name: string;
    email: string;
    password: string;
    roles?: string[];
    isSuperAdmin?: boolean;
  };

  const existingAdmin = await adminService.findByEmail(email);
  if (existingAdmin) {
    return res.status(400).send({
      success: false,
      message: "Admin with this email already exists",
      data: null,
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await adminService.create({
    name,
    email,
    passwordHash,
    roles: roles || [],
    isSuperAdmin: isSuperAdmin || false,
    status: "active",
  });

  const adminObject = admin.toObject();
  const { passwordHash: _, __v, ...safeAdmin } = adminObject;

  res.send(successResponse("Admin created successfully", safeAdmin));
}

export async function updateAdmin(req: Request, res: Response) {
  const { id } = req.params;
  const { name, email, password, roles, isSuperAdmin, status } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    roles?: string[];
    isSuperAdmin?: boolean;
    status?: string;
  };

  const admin = await adminService.findById(id);
  if (!admin) throw new NotFoundError("Admin not found");

  const updateData: Partial<IAdmin> = {};

  if (name) updateData.name = name;
  if (email) {
    const existingAdmin = await adminService.findByEmail(email);
    if (existingAdmin && existingAdmin._id.toString() !== id) {
      return res.status(400).send({
        success: false,
        message: "Admin with this email already exists",
        data: null,
      });
    }
    updateData.email = email;
  }
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }
  if (roles !== undefined) updateData.roles = roles;
  if (isSuperAdmin !== undefined) updateData.isSuperAdmin = isSuperAdmin;
  if (status) updateData.status = status as "active" | "inactive" | "deleted";

  await adminService.update(id, updateData);

  res.send(successResponse("Admin updated successfully"));
}

export async function disableAdmin(req: Request, res: Response) {
  const { id } = req.params;

  const admin = await adminService.findById(id);
  if (!admin) throw new NotFoundError("Admin not found");

  await adminService.update(id, { status: "inactive" });

  res.send(successResponse("Admin disabled successfully"));
}

