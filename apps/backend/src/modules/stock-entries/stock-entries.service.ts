import StockEntry from "./stock-entries.model";
import { IStockEntry } from "./stock-entries.types";

class StockEntriesService {
  async list({
    sort = -1,
    limit = 10,
    page = 1,
    inventoryItemId,
    operationType,
  }: {
    sort?: 1 | -1;
    limit?: number;
    page?: number;
    inventoryItemId?: string;
    operationType?: string;
  }): Promise<IStockEntry[]> {
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (inventoryItemId) filter.inventoryItemId = inventoryItemId;
    if (operationType) filter.operationType = operationType;

    return StockEntry.find(filter)
      .sort({ _id: sort })
      .limit(limit)
      .skip(skip);
  }
}

const stockEntriesService = new StockEntriesService();

export default stockEntriesService;


