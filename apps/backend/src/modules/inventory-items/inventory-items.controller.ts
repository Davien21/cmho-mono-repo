import { Request, Response } from "express";
import inventoryItemsService from "./inventory-items.service";
import { errorResponse, successResponse } from "../../utils/response";
import { GetInventoryItemsQuerySchema } from "./inventory-items.validators";

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


