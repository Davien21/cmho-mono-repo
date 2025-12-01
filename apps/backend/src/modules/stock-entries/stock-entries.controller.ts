import { Request, Response } from "express";
import stockEntriesService from "./stock-entries.service";
import { errorResponse, successResponse } from "../../utils/response";
import { GetStockEntriesQuerySchema } from "./stock-entries.validators";

export async function getStockEntries(
  req: Request<{}, {}, {}, GetStockEntriesQuerySchema>,
  res: Response
) {
  try {
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

    res.send(successResponse("Stock entries fetched successfully", entries));
  } catch (error) {
    res.status(500).send(errorResponse("Failed to fetch stock entries"));
  }
}


