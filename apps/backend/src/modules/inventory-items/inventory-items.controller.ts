import { Request, Response } from "express";
import inventoryItemsService from "./inventory-items.service";
import { successResponse } from "../../utils/response";
import { GetInventoryItemsQuerySchema } from "./inventory-items.validators";
import { IInventoryItemRequest } from "./inventory-items.types";
import activityTrackingService from "../activity-tracking/activity-tracking.service";
import { ActivityTypes } from "../activity-tracking/activity-tracking.types";
import { getAdminFromReq } from "../../utils/request-helpers";
import {
  buildUpdateDescription,
  extractChangesMetadata,
} from "../../utils/description-builder";

export async function getInventoryItems(
  req: Request<{}, {}, {}, GetInventoryItemsQuerySchema>,
  res: Response
) {
  const {
    sort = "desc",
    limit = "10",
    page = "1",
    status,
    category,
    search,
    stockFilter,
  } = req.query;

  const result = await inventoryItemsService.list({
    sort: sort === "desc" ? -1 : 1,
    limit: parseInt(limit),
    page: parseInt(page),
    status,
    category,
    search,
    stockFilter: stockFilter as
      | "outOfStock"
      | "lowStock"
      | "inStock"
      | undefined,
  });

  res.send(successResponse("Inventory items fetched successfully", result));
}

export async function createInventoryItem(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const data = req.body as IInventoryItemRequest;

  // Attach createdBy from authenticated user
  (data as any).createdBy = admin._id;

  const item = await inventoryItemsService.create(data);

  // Track the activity
  const itemName = item.name || data.name || "Unknown Item";
  const categoryName =
    typeof item.category === "object" && item.category
      ? item.category.name
      : "Unknown Category";
  const activityData = {
    type: ActivityTypes.CREATE_INVENTORY_ITEM,
    module: "inventory",
    entities: [{ id: item._id, name: "inventory-item" }],
    performerId: admin._id,
    performerName: admin.name,
    description: `Created inventory item "${itemName}"`,
    metadata: {
      category: categoryName,
    },
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Inventory item created successfully", item));
}

export async function updateInventoryItem(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const { id } = req.params;
  const body = req.body as Partial<IInventoryItemRequest> & {
    _changes?: any;
  };

  // Extract change metadata and clean body
  const { changes, cleanBody } = extractChangesMetadata(body);
  const data = cleanBody as Partial<IInventoryItemRequest>;

  const item = await inventoryItemsService.update(id, data);

  // Track the activity
  if (item) {
    const itemName = item.name || "Unknown Item";

    // Build description from change metadata if available
    let description: string;
    if (changes && changes.changedFields.length > 0) {
      description = buildUpdateDescription({
        entityName: "inventory item",
        entityDisplayName: itemName,
        changes,
        fieldMappings: {
          name: "name",
          category: "category",
          image: "Image",
          lowStockValue: "low stock value",
          canBeSold: "can be sold",
        },
        specialHandlers: {
          image: true,
        },
      });
    } else {
      // Fallback if no change metadata provided
      description = `Updated inventory item "${itemName}"`;
    }

    const activityData = {
      type: ActivityTypes.UPDATE_INVENTORY_ITEM,
      module: "inventory",
      entities: [{ id: id, name: "inventory-item" }],
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

  res.send(successResponse("Inventory item updated successfully", item));
}

export async function deleteInventoryItem(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const { id } = req.params;

  // Get item name before deletion
  const item = await inventoryItemsService.findById(id);
  const itemName = item?.name || "Unknown Item";

  await inventoryItemsService.delete(id);

  // Track the activity
  const activityData = {
    type: ActivityTypes.DELETE_INVENTORY_ITEM,
    module: "inventory",
    entities: [{ id: id, name: "inventory-item" }],
    performerId: admin._id,
    performerName: admin.name,
    description: `Deleted inventory item "${itemName}"`,
    metadata: {},
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Inventory item deleted successfully"));
}
