import StockEntry from "./stock-entries.model";
import { IStockEntry, StockEntryRequest } from "./stock-entries.types";
import InventoryItem from "../inventory-items/inventory-items.model";

interface AddStockRequest {
  inventoryItemId: string;
  supplier?: {
    supplierId: string;
    name: string;
  } | null;
  costPrice: number;
  sellingPrice: number;
  expiryDate: Date;
  quantityInBaseUnits: number;
}

interface ReduceStockRequest {
  inventoryItemId: string;
  supplier?: {
    supplierId: string;
    name: string;
  } | null;
  costPrice?: number | null;
  sellingPrice?: number | null;
  expiryDate?: Date | null;
  quantityInBaseUnits: number;
}

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

  async addStock(
    data: AddStockRequest,
    createdBy: string
  ): Promise<IStockEntry> {
    // Create stock entry with operationType: "add"
    const entry = await StockEntry.create({
      ...data,
      operationType: "add",
      quantityInBaseUnits: Math.abs(data.quantityInBaseUnits),
      createdBy,
    });

    // Update inventory item stock and expiry date
    const item = await InventoryItem.findById(entry.inventoryItemId);
    if (item) {
      const currentStock = item.currentStockInBaseUnits ?? 0;
      const nextStock = currentStock + entry.quantityInBaseUnits;

      let earliestExpiryDate = item.earliestExpiryDate;

      // Update earliestExpiryDate when adding stock
      if (entry.expiryDate) {
        const now = new Date();

        // 1) Normal case: keep the earliest expiry we've ever seen
        if (!earliestExpiryDate || entry.expiryDate < earliestExpiryDate) {
          earliestExpiryDate = entry.expiryDate;
        }
        // 2) If the current earliestExpiryDate is already in the past,
        //    allow it to move forward to a later batch's expiry date.
        else if (
          earliestExpiryDate < now &&
          entry.expiryDate > earliestExpiryDate
        ) {
          earliestExpiryDate = entry.expiryDate;
        }
      }

      item.currentStockInBaseUnits = nextStock;
      item.earliestExpiryDate = earliestExpiryDate;
      await item.save();
    }

    return entry;
  }

  async reduceStock(
    data: ReduceStockRequest,
    createdBy: string
  ): Promise<IStockEntry> {
    // Set default values for reduce operations
    const entryData = {
      ...data,
      costPrice: data.costPrice ?? 0,
      sellingPrice: data.sellingPrice ?? 0,
      expiryDate: data.expiryDate ?? new Date(),
    };

    // Create stock entry with operationType: "reduce"
    const entry = await StockEntry.create({
      ...entryData,
      operationType: "reduce",
      quantityInBaseUnits: Math.abs(data.quantityInBaseUnits),
      createdBy,
    });

    // Update inventory item stock (subtract quantity)
    const item = await InventoryItem.findById(entry.inventoryItemId);
    if (item) {
      const currentStock = item.currentStockInBaseUnits ?? 0;
      const nextStock = currentStock - entry.quantityInBaseUnits;

      // Ensure stock doesn't go negative (or handle as needed)
      item.currentStockInBaseUnits = Math.max(0, nextStock);
      await item.save();
    }

    return entry;
  }

  async create(data: StockEntryRequest): Promise<IStockEntry> {
    // For reduce operations, set default values if not provided
    const entryData: StockEntryRequest = {
      ...data,
      ...(data.operationType === "reduce" && {
        costPrice: data.costPrice ?? 0,
        sellingPrice: data.sellingPrice ?? 0,
        expiryDate: data.expiryDate ?? new Date(),
      }),
    };

    // Ensure quantity is stored as positive in the database for clarity
    // (we'll handle the sign when updating stock)
    const quantityToStore = Math.abs(entryData.quantityInBaseUnits);
    const entry = await StockEntry.create({
      ...entryData,
      quantityInBaseUnits: quantityToStore,
    });

    // Incrementally update currentStockInBaseUnits and earliestExpiryDate
    const item = await InventoryItem.findById(entry.inventoryItemId);
    if (item) {
      const currentStock = item.currentStockInBaseUnits ?? 0;
      // For reduce operations, subtract the quantity; for add, add it
      const quantityDelta =
        entry.operationType === "reduce"
          ? -entry.quantityInBaseUnits
          : entry.quantityInBaseUnits;
      const nextStock = currentStock + quantityDelta;

      let earliestExpiryDate = item.earliestExpiryDate;

      // Only adjust earliestExpiryDate when we add stock
      if (entry.operationType === "add" && entry.expiryDate) {
        const now = new Date();

        // 1) Normal case: keep the earliest expiry we've ever seen
        if (!earliestExpiryDate || entry.expiryDate < earliestExpiryDate) {
          earliestExpiryDate = entry.expiryDate;
        }
        // 2) If the current earliestExpiryDate is already in the past,
        //    allow it to move forward to a later batch's expiry date.
        else if (
          earliestExpiryDate < now &&
          entry.expiryDate > earliestExpiryDate
        ) {
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
