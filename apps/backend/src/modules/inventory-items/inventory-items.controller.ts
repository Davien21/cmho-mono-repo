import { Request, Response } from "express";
import inventoryItemsService from "./inventory-items.service";
import { errorResponse, successResponse } from "../../utils/response";
import { GetInventoryItemsQuerySchema } from "./inventory-items.validators";
import { IInventoryItemRequest } from "./inventory-items.types";

export async function getInventoryItems(
  req: Request<{}, {}, {}, GetInventoryItemsQuerySchema>,
  res: Response
) {
  try {
    const {
      sort = "desc",
      limit = "10",
      page = "1",
      status,
      setupStatus,
      category,
      search,
    } = req.query;

    const items = await inventoryItemsService.list({
      sort: sort === "desc" ? -1 : 1,
      limit: parseInt(limit),
      page: parseInt(page),
      status,
      setupStatus,
      category,
      search,
    });

    res.send(successResponse("Inventory items fetched successfully", items));
  } catch (error) {
    res.status(500).send(errorResponse("Failed to fetch inventory items"));
  }
}

export async function createInventoryItem(req: Request, res: Response) {
  try {
    const data = req.body as IInventoryItemRequest;

    // Attach createdBy from authenticated user if available
    if (req.user?._id) {
      (data as any).createdBy = req.user._id;
    }

    const item = await inventoryItemsService.create(data);
    res.send(successResponse("Inventory item created successfully", item));
  } catch (error) {
    res.status(500).send(errorResponse("Failed to create inventory item"));
  }
}

export async function updateInventoryItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body as Partial<IInventoryItemRequest>;

    const item = await inventoryItemsService.update(id, data);

    res.send(successResponse("Inventory item updated successfully", item));
  } catch (error) {
    res.status(500).send(errorResponse("Failed to update inventory item"));
  }
}

export async function deleteInventoryItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await inventoryItemsService.delete(id);
    res.send(successResponse("Inventory item deleted successfully"));
  } catch (error) {
    res.status(500).send(errorResponse("Failed to delete inventory item"));
  }
}

