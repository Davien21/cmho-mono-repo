import StockEntry from './stock-entries.model';
import { IStockEntry, StockEntryRequest } from './stock-entries.types';
import InventoryItem from '../inventory-items/inventory-items.model';

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

    return StockEntry.find(filter).sort({ _id: sort }).limit(limit).skip(skip);
  }

  async create(data: StockEntryRequest): Promise<IStockEntry> {
    const entry = await StockEntry.create(data);

    // Incrementally update currentStockInBaseUnits and earliestExpiryDate
    const item = await InventoryItem.findById(entry.inventoryItemId);
    if (item) {
      const currentStock = item.currentStockInBaseUnits ?? 0;
      const nextStock = currentStock + entry.quantityInBaseUnits;

      let earliestExpiryDate = item.earliestExpiryDate;

      // Only adjust earliestExpiryDate when we add stock (positive quantity)
      if (entry.quantityInBaseUnits > 0 && entry.expiryDate) {
        const now = new Date();

        // 1) Normal case: keep the earliest expiry we've ever seen
        if (!earliestExpiryDate || entry.expiryDate < earliestExpiryDate) {
          earliestExpiryDate = entry.expiryDate;
        }
        // 2) If the current earliestExpiryDate is already in the past,
        //    allow it to move forward to a later batch's expiry date.
        else if (earliestExpiryDate < now && entry.expiryDate > earliestExpiryDate) {
          earliestExpiryDate = entry.expiryDate;
        }
      }

      item.currentStockInBaseUnits = nextStock;
      item.earliestExpiryDate = earliestExpiryDate;
      await item.save();
    }

    return entry;
  }
}

const stockEntriesService = new StockEntriesService();

export default stockEntriesService;
