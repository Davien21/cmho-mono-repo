import { Request, Response } from "express";
import stockEntriesService from "./stock-entries.service";
import { successResponse } from "../../utils/response";
import { GetStockEntriesQuerySchema } from "./stock-entries.validators";
import { StockEntryRequest } from "./stock-entries.types";
import { UnAuthorizedError } from "../../config/errors";

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

  res.send(successResponse("Stock entries fetched successfully", entries));
}

export async function createStockEntry(req: Request, res: Response) {
  const data = req.body as StockEntryRequest;

  // Attach createdBy from authenticated user if available
  if (req.user?._id) {
    (data as any).createdBy = req.user._id;
  }

  const entry = await stockEntriesService.create(data);
  res.send(successResponse("Stock entry created successfully", entry));
}

export async function addStock(req: Request, res: Response) {
  const data = req.body;

  if (!req.user?._id) {
    throw new UnAuthorizedError("Unauthorized");
  }

  const entry = await stockEntriesService.addStock(data, req.user._id);
  res.send(successResponse("Stock added successfully", entry));
}

export async function reduceStock(req: Request, res: Response) {
  const data = req.body;

  if (!req.user?._id) {
    throw new UnAuthorizedError("Unauthorized");
  }

  const entry = await stockEntriesService.reduceStock(data, req.user._id);
  res.send(successResponse("Stock reduced successfully", entry));
}
