import { Request, Response } from "express";
import adminService from "./admins.service";
import { successResponse } from "../../utils/response";
import { NotFoundError } from "../../config/errors";
import { IAdmin, AdminRole } from "./admins.types";
import bcrypt from "bcrypt";
import activityTrackingService from "../activity-tracking/activity-tracking.service";
import { ActivityTypes } from "../activity-tracking/activity-tracking.types";
import { getAdminFromReq } from "../../utils/request-helpers";
import {
  buildUpdateDescription,
  extractChangesMetadata,
} from "../../utils/description-builder";

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
  const currentAdmin = getAdminFromReq(req);
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
    roles: (roles || []) as AdminRole[],
    isSuperAdmin: isSuperAdmin || false,
    status: "active",
  });

  // Track the activity
  const roleText = admin.isSuperAdmin ? "Super Admin" : "Admin";
  const activityData = {
    type: ActivityTypes.CREATE_ADMIN,
    module: "admin",
    entities: [{ id: admin._id, name: "admin" }],
    performerId: currentAdmin._id,
    performerName: currentAdmin.name,
    description: `Created ${roleText} "${admin.name}"`,
    metadata: {
      email: admin.email,
      isSuperAdmin: admin.isSuperAdmin,
      roles: admin.roles,
    },
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Admin created successfully"));
}

export async function updateAdmin(req: Request, res: Response) {
  const currentAdmin = getAdminFromReq(req);
  const { id } = req.params;
  const body = req.body as {
    name?: string;
    email?: string;
    password?: string;
    roles?: string[];
    isSuperAdmin?: boolean;
    status?: string;
    _changes?: any;
  };

  // Extract change metadata and clean body
  const { changes, cleanBody } = extractChangesMetadata(body);
  const { name, email, password, roles, isSuperAdmin, status } = cleanBody;

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
  if (roles !== undefined) updateData.roles = roles as AdminRole[];
  if (isSuperAdmin !== undefined) updateData.isSuperAdmin = isSuperAdmin;
  if (status) updateData.status = status as "active" | "inactive" | "deleted";

  await adminService.update(id, updateData);

  // Track the activity
  // Use admin.name from the fetch above (no extra DB call needed)
  const adminName = updateData.name || admin.name || "Unknown Admin";

  // Build description from change metadata if available
  let description: string;
  if (changes && changes.changedFields.length > 0) {
    description = buildUpdateDescription({
      entityName: "admin",
      entityDisplayName: adminName,
      changes,
      fieldMappings: {
        name: "name",
        email: "email",
        password: "password",
        roles: "roles",
        isSuperAdmin: "super admin status",
        status: "status",
      },
      specialHandlers: {
        password: true,
        arrays: ["roles"],
      },
    });
  } else {
    // Fallback if no change metadata provided
    const changedFields = Object.keys(updateData);
    if (status !== undefined) {
      description = `Updated admin "${adminName}" status to ${status}`;
    } else if (changedFields.length === 1) {
      description = `Updated ${changedFields[0]} for admin "${adminName}"`;
    } else {
      description = `Updated admin "${adminName}"`;
    }
  }

  const activityData = {
    type: ActivityTypes.UPDATE_ADMIN,
    module: "admin",
    entities: [{ id: id, name: "admin" }],
    performerId: currentAdmin._id,
    performerName: currentAdmin.name,
    description,
    metadata: changes
      ? {
          changedFields: changes.changedFields,
          statusChanged: status !== undefined,
        }
      : {
          changedFields: Object.keys(updateData),
          statusChanged: status !== undefined,
        },
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Admin updated successfully"));
}

export async function disableAdmin(req: Request, res: Response) {
  const currentAdmin = getAdminFromReq(req);
  const { id } = req.params;

  const admin = await adminService.findById(id);
  if (!admin) throw new NotFoundError("Admin not found");

  await adminService.update(id, { status: "inactive" });

  // Track the activity
  const adminName = admin.name || "Unknown Admin";
  const activityData = {
    type: ActivityTypes.DISABLE_ADMIN,
    module: "admin",
    entities: [{ id: id, name: "admin" }],
    performerId: currentAdmin._id,
    performerName: currentAdmin.name,
    description: `Disabled admin "${adminName}"`,
    metadata: {
      statusChanged: true,
    },
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Admin disabled successfully"));
}
