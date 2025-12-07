import { Request, Response } from "express";
import stockEntriesService from "./stock-entries.service";
import { successResponse } from "../../utils/response";
import { GetStockEntriesQuerySchema } from "./stock-entries.validators";
import { StockEntryRequest } from "./stock-entries.types";
import activityTrackingService from "../activity-tracking/activity-tracking.service";
import inventoryItemsService from "../inventory-items/inventory-items.service";
import { ActivityTypes } from "../activity-tracking/activity-types";
import { getAdminFromReq } from "../../utils/request-helpers";

export async function getStockEntries(
  req: Request<{}, {}, {}, GetStockEntriesQuerySchema>,
  res: Response
) {
  const {
    sort = "desc",
    limit = "10",
    page = "1",
    inventoryItemId,
    operationType,
  } = req.query;

  const entries = await stockEntriesService.list({
    sort: sort === "desc" ? -1 : 1,
    limit: parseInt(limit),
    page: parseInt(page),
    inventoryItemId,
    operationType,
  });

  // Transform entries to include createdBy name
  const transformedEntries = entries.map((entry: any) => {
    const entryObj = entry.toObject ? entry.toObject() : entry;
    const createdBy = entryObj.createdBy;
    // Handle populated createdBy (object with _id and name) or unpopulated (ObjectId/string)
    const createdById =
      createdBy?._id?.toString() || createdBy?.toString() || createdBy || null;
    const createdByName = createdBy?.name || null;

    return {
      ...entryObj,
      createdBy: createdById,
      createdByName,
    };
  });

  res.send(
    successResponse("Stock entries fetched successfully", transformedEntries)
  );
}

export async function createStockEntry(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const data = req.body as StockEntryRequest;

  // Get previous stock before update
  const item = await inventoryItemsService.findById(
    data.inventoryItemId.toString()
  );
  const previousStock = item?.currentStockInBaseUnits ?? 0;

  // Attach createdBy from authenticated user
  (data as any).createdBy = admin._id;

  const entry = await stockEntriesService.create(data);

  // Get updated item after stock change
  const updatedItem = await inventoryItemsService.findById(
    data.inventoryItemId.toString()
  );

  // Track the activity
  const itemName = updatedItem?.name || "Unknown Item";
  const quantity = Math.abs(data.quantityInBaseUnits || 0);
  const actionType =
    data.operationType === "reduce"
      ? ActivityTypes.REDUCE_STOCK
      : ActivityTypes.ADD_STOCK;
  const activityData = {
    type: actionType,
    module: "inventory",
    entities: [
      { id: entry._id.toString(), name: "stock-entry" },
      { id: data.inventoryItemId.toString(), name: "inventory-item" },
    ],
    adminId: admin._id,
    adminName: admin.name,
    description:
      data.operationType === "reduce"
        ? `Reduced ${quantity} units of ${itemName}`
        : `Added ${quantity} units of ${itemName}`,
    metadata: {
      quantityInBaseUnits: quantity,
      operationType: data.operationType,
      expiryDate: data.expiryDate,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      previousStock,
      newStock: updatedItem?.currentStockInBaseUnits ?? 0,
    },
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Stock entry created successfully", entry));
}

export async function addStock(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const data = req.body;

  // Get previous stock before update
  const item = await inventoryItemsService.findById(data.inventoryItemId);
  const previousStock = item?.currentStockInBaseUnits ?? 0;

  const entry = await stockEntriesService.addStock(data, admin._id.toString());

  // Get updated item after stock addition
  const updatedItem = await inventoryItemsService.findById(
    data.inventoryItemId
  );

  // Track the activity
  const itemName = updatedItem?.name || "Unknown Item";
  const quantity = data.quantityInBaseUnits || 0;
  const activityData = {
    type: ActivityTypes.ADD_STOCK,
    module: "inventory",
    entities: [
      { id: entry._id.toString(), name: "stock-entry" },
      { id: data.inventoryItemId.toString(), name: "inventory-item" },
    ],
    adminId: admin._id,
    adminName: admin.name,
    description: `Added ${quantity} units of ${itemName}`,
    metadata: {
      quantityInBaseUnits: quantity,
      unitId: data.unitId,
      expiryDate: data.expiryDate,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      previousStock,
      newStock: updatedItem?.currentStockInBaseUnits ?? 0,
    },
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Stock added successfully", entry));
}

export async function reduceStock(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const data = req.body;

  // Get previous stock before update
  const item = await inventoryItemsService.findById(data.inventoryItemId);
  const previousStock = item?.currentStockInBaseUnits ?? 0;

  const entry = await stockEntriesService.reduceStock(
    data,
    admin._id.toString()
  );

  // Get updated item after stock reduction
  const updatedItem = await inventoryItemsService.findById(
    data.inventoryItemId
  );

  // Track the activity
  const itemName = updatedItem?.name || "Unknown Item";
  const quantity = data.quantityInBaseUnits || 0;
  const activityData = {
    type: ActivityTypes.REDUCE_STOCK,
    module: "inventory",
    entities: [
      { id: entry._id.toString(), name: "stock-entry" },
      { id: data.inventoryItemId.toString(), name: "inventory-item" },
    ],
    adminId: admin._id,
    adminName: admin.name,
    description: `Reduced ${quantity} units of ${itemName}`,
    metadata: {
      quantityInBaseUnits: quantity,
      unitId: data.unitId,
      expiryDate: data.expiryDate,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      previousStock,
      newStock: updatedItem?.currentStockInBaseUnits ?? 0,
    },
  };
  await activityTrackingService.trackActivity(activityData);

  res.send(successResponse("Stock reduced successfully", entry));
}
