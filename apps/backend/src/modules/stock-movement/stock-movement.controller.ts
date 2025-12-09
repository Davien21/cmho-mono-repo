import { Request, Response } from "express";
import stockMovementService from "./stock-movement.service";
import { successResponse } from "../../utils/response";
import { GetStockMovementQuerySchema } from "./stock-movement.validators";
import { StockMovementRequest } from "./stock-movement.types";
import activityTrackingService from "../activity-tracking/activity-tracking.service";
import inventoryItemsService from "../inventory-items/inventory-items.service";
import { ActivityTypes } from "../activity-tracking/activity-tracking.types";
import { getAdminFromReq } from "../../utils/request-helpers";

export async function getStockMovement(
  req: Request<{}, {}, {}, GetStockMovementQuerySchema>,
  res: Response
) {
  const {
    sort = "desc",
    limit = "10",
    page = "1",
    inventoryItemId,
    operationType,
  } = req.query;

  const result = await stockMovementService.list({
    sort: sort === "desc" ? -1 : 1,
    limit: parseInt(limit),
    page: parseInt(page),
    inventoryItemId,
    operationType,
  });

  // Return entries as-is (performerName is already in the model)

  res.send(successResponse("Stock movement fetched successfully", result));
}

export async function createStockMovement(
  req: Request<{}, {}, StockMovementRequest, {}>,
  res: Response
) {
  const admin = getAdminFromReq(req);
  const data = req.body;

  // Get previous stock before update
  const item = await inventoryItemsService.findById(data.inventoryItemId);
  const previousStock = item?.currentStockInBaseUnits ?? 0;

  // Attach performerId and performerName from authenticated user
  const performerData = {
    performerId: admin._id,
    performerName: admin.name,
  };

  const entry = await stockMovementService.create({ ...data, ...performerData });

  // Get updated item after stock change
  const updatedItem = await inventoryItemsService.findById(
    data.inventoryItemId
  );

  // Track the activity
  const itemName = updatedItem?.name || "Unknown Item";
  const quantity = Math.abs(data.quantityInBaseUnits || 0);
  const actionType =
    data.operationType === "reduce"
      ? ActivityTypes.REDUCE_STOCK
      : ActivityTypes.ADD_STOCK;

  const AddStockDesc = `Added ${quantity} units of ${itemName}`;
  const ReduceStockDesc = `Reduced ${quantity} units of ${itemName}`;

  const description =
    data.operationType === "add" ? AddStockDesc : ReduceStockDesc;

  const activityData = {
    type: actionType,
    module: "inventory",
    entities: [
      { id: entry._id, name: "stock-movement" },
      { id: data.inventoryItemId, name: "inventory-item" },
    ],
    ...performerData,
    description,
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

  res.send(successResponse("Stock movement created successfully", entry));
}

export async function addStock(req: Request, res: Response) {
  const admin = getAdminFromReq(req);
  const data = req.body;

  // Get previous stock before update
  const item = await inventoryItemsService.findById(data.inventoryItemId);
  const previousStock = item?.currentStockInBaseUnits ?? 0;

  const entry = await stockMovementService.addStock(data, admin._id, admin.name);

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
      { id: entry._id, name: "stock-movement" },
      { id: data.inventoryItemId, name: "inventory-item" },
    ],
    performerId: admin._id,
    performerName: admin.name,
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

  const entry = await stockMovementService.reduceStock(
    data,
    admin._id,
    admin.name
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
      { id: entry._id, name: "stock-movement" },
      { id: data.inventoryItemId, name: "inventory-item" },
    ],
    performerId: admin._id,
    performerName: admin.name,
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

