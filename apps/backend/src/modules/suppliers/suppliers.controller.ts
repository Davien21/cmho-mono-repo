import { Request, Response } from "express";
import suppliersService from "./suppliers.service";
import { successResponse } from "../../utils/response";
import { SupplierRequest } from "./suppliers.types";
import activityTrackingService from "../activity-tracking/activity-tracking.service";
import { ActivityTypes } from "../activity-tracking/activity-tracking.types";
import { getAdminFromReq } from "../../utils/request-helpers";
import {
  buildUpdateDescription,
  extractChangesMetadata,
} from "../../utils/description-builder";

export async function getSuppliers(_req: Request, res: Response) {
  const suppliers = await suppliersService.list();
  res.send(successResponse("Suppliers fetched successfully", suppliers));
}

export async function createSupplier(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const data = req.body as SupplierRequest;
  const supplier = await suppliersService.create(data);

  // Track the activity
  const supplierName = supplier.name || data.name || "Unknown Supplier";
  const activityData = {
    type: ActivityTypes.CREATE_SUPPLIER,
    module: "inventory",
    entities: [{ id: supplier._id, name: "supplier" }],
    performerId: admin._id,
    performerName: admin.name,
    description: `Created supplier "${supplierName}"`,
    metadata: {},
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Supplier created successfully", supplier));
}

export async function updateSupplier(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const { id } = req.params;
  const body = req.body as Partial<SupplierRequest> & { _changes?: any };

  // Extract change metadata and clean body
  const { changes, cleanBody } = extractChangesMetadata(body);
  const data = cleanBody as Partial<SupplierRequest>;

  const supplier = await suppliersService.update(id, data);

  // Track the activity
  if (supplier) {
    const supplierName = supplier.name || "Unknown Supplier";

    // Build description from change metadata if available
    let description: string;
    if (changes && changes.changedFields.length > 0) {
      description = buildUpdateDescription({
        entityName: "supplier",
        entityDisplayName: supplierName,
        changes,
        fieldMappings: {
          name: "name",
          email: "email",
          phone: "phone",
          address: "address",
        },
      });
    } else {
      // Fallback if no change metadata provided
      description = `Updated supplier "${supplierName}"`;
    }

    const activityData = {
      type: ActivityTypes.UPDATE_SUPPLIER,
      module: "inventory",
      entities: [{ id: id, name: "supplier" }],
      performerId: admin._id,
      performerName: admin.name,
      description,
      metadata: changes
        ? {
            changedFields: changes.changedFields,
          }
        : {},
    };
    await activityTrackingService.trackActivity(activityData);
  }

  res.send(successResponse("Supplier updated successfully", supplier));
}

export async function deleteSupplier(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const { id } = req.params;

  // Get supplier name before deletion
  const supplier = await suppliersService.findById(id);
  const supplierName = supplier?.name || "Unknown Supplier";

  await suppliersService.delete(id);

  // Track the activity
  const activityData = {
    type: ActivityTypes.DELETE_SUPPLIER,
    module: "inventory",
    entities: [{ id: id, name: "supplier" }],
    performerId: admin._id,
    performerName: admin.name,
    description: `Deleted supplier "${supplierName}"`,
    metadata: {},
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Supplier deleted successfully"));
}
