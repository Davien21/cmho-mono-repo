import StockMovement from "./stock-movement.model";
import { IStockMovement, StockMovementRequest } from "./stock-movement.types";
import InventoryItem from "../inventory-items/inventory-items.model";
import { Types } from "mongoose";

/**
 * Normalizes an expiry date to the first day of the month.
 * This ensures expiry dates are stored consistently as month/year only.
 */
function normalizeExpiryDate(
  date: Date | string | null | undefined
): Date | null {
  if (!date) return null;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return null;

  // Set to first day of the month
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
}

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

class StockMovementService {
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
  }): Promise<{
    data: IStockMovement[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (inventoryItemId) filter.inventoryItemId = inventoryItemId;
    if (operationType) filter.operationType = operationType;

    const [data, total] = await Promise.all([
      StockMovement.find(filter).sort({ _id: sort }).limit(limit).skip(skip),
      StockMovement.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async addStock(
    data: AddStockRequest,
    performerId: Types.ObjectId,
    performerName: string
  ): Promise<IStockMovement> {
    // Normalize expiry date to first day of month
    const normalizedExpiryDate = normalizeExpiryDate(data.expiryDate);

    // Create stock movement with operationType: "add"
    const entry = await StockMovement.create({
      ...data,
      expiryDate: normalizedExpiryDate || data.expiryDate,
      operationType: "add",
      quantityInBaseUnits: Math.abs(data.quantityInBaseUnits),
      performerId,
      performerName,
    });

    // Update inventory item stock
    const item = await InventoryItem.findOne({
      _id: entry.inventoryItemId,
      isDeleted: { $ne: true },
    });
    if (item) {
      const currentStock = item.currentStockInBaseUnits ?? 0;
      const nextStock = currentStock + entry.quantityInBaseUnits;

      item.currentStockInBaseUnits = nextStock;
      await item.save();

      // Update entry with balance
      entry.balance = nextStock;
      await entry.save();
    }

    return entry;
  }

  async reduceStock(
    data: ReduceStockRequest,
    performerId: Types.ObjectId,
    performerName: string
  ): Promise<IStockMovement> {
    // Normalize expiry date to first day of month if provided
    const normalizedExpiryDate = data.expiryDate
      ? normalizeExpiryDate(data.expiryDate)
      : null;

    // Set default values for reduce operations
    const entryData = {
      ...data,
      costPrice: data.costPrice ?? 0,
      sellingPrice: data.sellingPrice ?? 0,
      expiryDate:
        normalizedExpiryDate ??
        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    };

    // Create stock movement with operationType: "reduce"
    const entry = await StockMovement.create({
      ...entryData,
      operationType: "reduce",
      quantityInBaseUnits: Math.abs(data.quantityInBaseUnits),
      performerId,
      performerName,
    });

    // Update inventory item stock (subtract quantity)
    const item = await InventoryItem.findOne({
      _id: entry.inventoryItemId,
      isDeleted: { $ne: true },
    });
    if (item) {
      const currentStock = item.currentStockInBaseUnits ?? 0;
      const nextStock = currentStock - entry.quantityInBaseUnits;

      // Ensure stock doesn't go negative (or handle as needed)
      const finalStock = Math.max(0, nextStock);
      item.currentStockInBaseUnits = finalStock;
      await item.save();

      // Update entry with balance
      entry.balance = finalStock;
      await entry.save();
    }

    return entry;
  }

  async findById(id: string): Promise<IStockMovement | null> {
    return StockMovement.findById(id);
  }

  async create(data: StockMovementRequest): Promise<IStockMovement> {
    // Normalize expiry date to first day of month if provided
    let normalizedExpiryDate: Date | undefined = undefined;
    if (data.expiryDate) {
      normalizedExpiryDate = normalizeExpiryDate(data.expiryDate) || undefined;
    } else if (data.operationType === "reduce") {
      // For reduce operations without expiry date, use first day of current month
      normalizedExpiryDate = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      );
    }

    // For reduce operations, set default values if not provided
    const entryData: StockMovementRequest = {
      ...data,
      ...(normalizedExpiryDate && { expiryDate: normalizedExpiryDate }),
      ...(data.operationType === "reduce" && {
        costPrice: data.costPrice ?? 0,
        sellingPrice: data.sellingPrice ?? 0,
      }),
    };

    // Ensure quantity is stored as positive in the database for clarity
    // (we'll handle the sign when updating stock)
    const quantityToStore = Math.abs(entryData.quantityInBaseUnits);
    const entry = await StockMovement.create({
      ...entryData,
      quantityInBaseUnits: quantityToStore,
    });

    // Incrementally update currentStockInBaseUnits
    const item = await InventoryItem.findOne({
      _id: entry.inventoryItemId,
      isDeleted: { $ne: true },
    });
    if (item) {
      const currentStock = item.currentStockInBaseUnits ?? 0;
      // For reduce operations, subtract the quantity; for add, add it
      const quantityDelta =
        entry.operationType === "reduce"
          ? -entry.quantityInBaseUnits
          : entry.quantityInBaseUnits;
      const nextStock = currentStock + quantityDelta;

      item.currentStockInBaseUnits = nextStock;
      await item.save();

      // Update entry with balance
      entry.balance = nextStock;
      await entry.save();
    }

    return entry;
  }
}

const stockMovementService = new StockMovementService();

export default stockMovementService;

