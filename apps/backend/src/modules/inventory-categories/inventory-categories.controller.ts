import { Request, Response } from "express";
import inventoryCategoriesService from "./inventory-categories.service";
import { successResponse } from "../../utils/response";
import { IInventoryCategoryRequest } from "./inventory-categories.types";

export async function getInventoryCategories(_req: Request, res: Response) {
  const categories = await inventoryCategoriesService.list();
  res.send(
    successResponse("Inventory categories fetched successfully", categories)
  );
}

export async function createInventoryCategory(req: Request, res: Response) {
  const data = req.body as IInventoryCategoryRequest;
  const category = await inventoryCategoriesService.create(data);
  res.send(
    successResponse("Inventory category created successfully", category)
  );
}

export async function updateInventoryCategory(req: Request, res: Response) {
  const { id } = req.params;
  const data = req.body as Partial<IInventoryCategoryRequest>;

  const category = await inventoryCategoriesService.update(id, data);

  res.send(
    successResponse("Inventory category updated successfully", category)
  );
}

export async function deleteInventoryCategory(req: Request, res: Response) {
  const { id } = req.params;
  await inventoryCategoriesService.delete(id);
  res.send(successResponse("Inventory category deleted successfully"));
}

export async function reorderInventoryCategories(req: Request, res: Response) {
  const { categoryOrders } = req.body as {
    categoryOrders: Array<{ id: string; order: number }>;
  };
  await inventoryCategoriesService.reorder(categoryOrders);
  res.send(successResponse("Inventory categories reordered successfully"));
}
