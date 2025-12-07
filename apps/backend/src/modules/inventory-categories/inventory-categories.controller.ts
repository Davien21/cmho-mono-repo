import { Request, Response } from "express";
import inventoryCategoriesService from "./inventory-categories.service";
import { successResponse } from "../../utils/response";
import { IInventoryCategoryRequest } from "./inventory-categories.types";
import activityTrackingService from "../activity-tracking/activity-tracking.service";
import { ActivityTypes } from "../activity-tracking/activity-types";
import { getAdminFromReq } from "../../utils/request-helpers";

export async function getInventoryCategories(_req: Request, res: Response) {
  const categories = await inventoryCategoriesService.list();
  res.send(
    successResponse("Inventory categories fetched successfully", categories)
  );
}

export async function createInventoryCategory(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const data = req.body as IInventoryCategoryRequest;
  const category = await inventoryCategoriesService.create(data);

  // Track the activity
  const categoryName = category.name || data.name || "Unknown Category";
  const activityData = {
    type: ActivityTypes.CREATE_INVENTORY_CATEGORY,
    module: "inventory",
    entities: [{ id: category._id.toString(), name: "inventory-category" }],
    adminId: admin._id,
    adminName: admin.name,
    description: `Created category "${categoryName}"`,
    metadata: {
      canBeSold: data.canBeSold,
    },
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(
    successResponse("Inventory category created successfully", category)
  );
}

export async function updateInventoryCategory(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const { id } = req.params;
  const data = req.body as Partial<IInventoryCategoryRequest>;

  // Get old name if name is being changed
  const oldCategory = data.name
    ? await inventoryCategoriesService.findById(id)
    : null;
  const oldName = oldCategory?.name;

  const category = await inventoryCategoriesService.update(id, data);

  // Track the activity
  if (category) {
    const categoryName = category.name || "Unknown Category";
    let description: string;

    if (data.name !== undefined && oldName && oldName !== category.name) {
      description = `Renamed category from "${oldName}" to "${category.name}"`;
    } else {
      const changedFields = Object.keys(data);
      description =
        changedFields.length === 1
          ? `Updated ${changedFields[0]} for category "${categoryName}"`
          : `Updated category "${categoryName}"`;
    }

    const activityData = {
      type: ActivityTypes.UPDATE_INVENTORY_CATEGORY,
      module: "inventory",
      entities: [{ id: id, name: "inventory-category" }],
      adminId: admin._id,
      adminName: admin.name,
      description,
      metadata: {
        changedFields: Object.keys(data),
        nameChanged: data.name !== undefined,
      },
    };
    await activityTrackingService.trackActivity(activityData);
  }

  res.send(
    successResponse("Inventory category updated successfully", category)
  );
}

export async function deleteInventoryCategory(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const { id } = req.params;

  // Get category name before deletion
  const category = await inventoryCategoriesService.findById(id);
  const categoryName = category?.name || "Unknown Category";

  await inventoryCategoriesService.delete(id);

  // Track the activity
  const activityData = {
    type: ActivityTypes.DELETE_INVENTORY_CATEGORY,
    module: "inventory",
    entities: [{ id: id, name: "inventory-category" }],
    adminId: admin._id,
    adminName: admin.name,
    description: `Deleted category "${categoryName}"`,
    metadata: {},
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Inventory category deleted successfully"));
}

export async function reorderInventoryCategories(req: Request, res: Response) {
  const { categoryOrders } = req.body as {
    categoryOrders: Array<{ id: string; order: number }>;
  };

  await inventoryCategoriesService.reorder(categoryOrders);

  res.send(successResponse("Inventory categories reordered successfully"));
}
