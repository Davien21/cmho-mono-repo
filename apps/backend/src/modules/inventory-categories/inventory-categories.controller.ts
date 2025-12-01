import { Request, Response } from "express";
import inventoryCategoriesService from "./inventory-categories.service";
import { errorResponse, successResponse } from "../../utils/response";
import { IInventoryCategoryRequest } from "./inventory-categories.types";

export async function getInventoryCategories(_req: Request, res: Response) {
  try {
    const categories = await inventoryCategoriesService.list();
    res.send(
      successResponse("Inventory categories fetched successfully", categories)
    );
  } catch (error) {
    res.status(500).send(errorResponse("Failed to fetch inventory categories"));
  }
}

export async function createInventoryCategory(req: Request, res: Response) {
  try {
    const data = req.body as IInventoryCategoryRequest;
    const category = await inventoryCategoriesService.create(data);
    res.send(
      successResponse("Inventory category created successfully", category)
    );
  } catch (error) {
    res.status(500).send(errorResponse("Failed to create inventory category"));
  }
}

export async function updateInventoryCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body as Partial<IInventoryCategoryRequest>;

    const category = await inventoryCategoriesService.update(id, data);

    res.send(
      successResponse("Inventory category updated successfully", category)
    );
  } catch (error) {
    res.status(500).send(errorResponse("Failed to update inventory category"));
  }
}

export async function deleteInventoryCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await inventoryCategoriesService.delete(id);
    res.send(successResponse("Inventory category deleted successfully"));
  } catch (error) {
    res.status(500).send(errorResponse("Failed to delete inventory category"));
  }
}
