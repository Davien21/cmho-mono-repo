import { Request, Response } from 'express';
import stockEntriesService from './stock-entries.service';
import { errorResponse, successResponse } from '../../utils/response';
import { GetStockEntriesQuerySchema } from './stock-entries.validators';
import { StockEntryRequest } from './stock-entries.types';

export async function getStockEntries(
  req: Request<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    GetStockEntriesQuerySchema
  >,
  res: Response
) {
  try {
    const { sort = 'desc', limit = '10', page = '1', inventoryItemId, operationType } = req.query;

    const entries = await stockEntriesService.list({
      sort: sort === 'desc' ? -1 : 1,
      limit: parseInt(limit),
      page: parseInt(page),
      inventoryItemId,
      operationType,
    });

    res.send(successResponse('Stock entries fetched successfully', entries));
  } catch (error) {
    res.status(500).send(errorResponse('Failed to fetch stock entries'));
  }
}

export async function createStockEntry(req: Request, res: Response) {
  try {
    const data = req.body as StockEntryRequest;

    // Attach createdBy from authenticated user if available
    if (req.user?._id) {
      (data as any).createdBy = req.user._id;
    }

    const entry = await stockEntriesService.create(data);
    res.send(successResponse('Stock entry created successfully', entry));
  } catch (error) {
    res.status(500).send(errorResponse('Failed to create stock entry'));
  }
}
