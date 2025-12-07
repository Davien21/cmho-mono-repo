import { Request, Response } from "express";
import inventoryUnitsService from "./inventory-units.service";
import { successResponse } from "../../utils/response";
import { IInventoryUnitDefinitionRequest } from "./inventory-units.types";
import activityTrackingService from "../activity-tracking/activity-tracking.service";
import { ActivityTypes } from "../activity-tracking/activity-types";
import { getAdminFromReq } from "../../utils/request-helpers";

export async function getInventoryUnits(_req: Request, res: Response) {
  const units = await inventoryUnitsService.list();
  res.send(successResponse("Inventory units fetched successfully", units));
}

export async function createInventoryUnit(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const data = req.body as IInventoryUnitDefinitionRequest;
  const unit = await inventoryUnitsService.create(data);

  // Track the activity
  const unitName = unit.name || data.name || "Unknown Unit";
  const activityData = {
    type: ActivityTypes.CREATE_INVENTORY_UNIT,
    module: "inventory",
    entities: [{ id: unit._id.toString(), name: "inventory-unit" }],
    adminId: admin._id,
    adminName: admin.name,
    description: `Created unit "${unitName}"`,
    metadata: {},
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Inventory unit created successfully", unit));
}

export async function updateInventoryUnit(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const { id } = req.params;
  const data = req.body as Partial<IInventoryUnitDefinitionRequest>;

  const unit = await inventoryUnitsService.update(id, data);

  // Track the activity
  if (unit) {
    const unitName = unit.name || "Unknown Unit";
    const changedFields = Object.keys(data);
    const activityData = {
      type: ActivityTypes.UPDATE_INVENTORY_UNIT,
      module: "inventory",
      entities: [{ id: id, name: "inventory-unit" }],
      adminId: admin._id,
      adminName: admin.name,
      description:
        changedFields.length === 1
          ? `Updated ${changedFields[0]} for unit "${unitName}"`
          : `Updated unit "${unitName}"`,
      metadata: {
        changedFields,
      },
    };
    await activityTrackingService.trackActivity(activityData);
  }

  res.send(successResponse("Inventory unit updated successfully", unit));
}

export async function deleteInventoryUnit(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const { id } = req.params;

  // Get unit name before deletion
  const unit = await inventoryUnitsService.findById(id);
  const unitName = unit?.name || "Unknown Unit";

  await inventoryUnitsService.delete(id);

  // Track the activity
  const activityData = {
    type: ActivityTypes.DELETE_INVENTORY_UNIT,
    module: "inventory",
    entities: [{ id: id, name: "inventory-unit" }],
    adminId: admin._id,
    adminName: admin.name,
    description: `Deleted unit "${unitName}"`,
    metadata: {},
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Inventory unit deleted successfully"));
}

export async function reorderInventoryUnits(req: Request, res: Response) {
  const { unitOrders } = req.body as {
    unitOrders: Array<{ id: string; order: number }>;
  };

  await inventoryUnitsService.reorder(unitOrders);

  res.send(successResponse("Inventory units reordered successfully"));
}
