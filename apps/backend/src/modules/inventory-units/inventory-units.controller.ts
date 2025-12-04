import { Request, Response } from "express";
import inventoryUnitsService from "./inventory-units.service";
import { successResponse } from "../../utils/response";
import { IInventoryUnitDefinitionRequest } from "./inventory-units.types";

export async function getInventoryUnits(_req: Request, res: Response) {
  const units = await inventoryUnitsService.list();
  res.send(successResponse("Inventory units fetched successfully", units));
}

export async function createInventoryUnit(req: Request, res: Response) {
  const data = req.body as IInventoryUnitDefinitionRequest;
  const unit = await inventoryUnitsService.create(data);
  res.send(successResponse("Inventory unit created successfully", unit));
}

export async function updateInventoryUnit(req: Request, res: Response) {
  const { id } = req.params;
  const data = req.body as Partial<IInventoryUnitDefinitionRequest>;

  const unit = await inventoryUnitsService.update(id, data);

  res.send(successResponse("Inventory unit updated successfully", unit));
}

export async function deleteInventoryUnit(req: Request, res: Response) {
  const { id } = req.params;
  await inventoryUnitsService.delete(id);
  res.send(successResponse("Inventory unit deleted successfully"));
}

export async function reorderInventoryUnits(req: Request, res: Response) {
  const { unitOrders } = req.body as {
    unitOrders: Array<{ id: string; order: number }>;
  };
  await inventoryUnitsService.reorder(unitOrders);
  res.send(successResponse("Inventory units reordered successfully"));
}
