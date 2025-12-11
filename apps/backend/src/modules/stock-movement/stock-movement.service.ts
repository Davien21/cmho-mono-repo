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
    search,
  }: {
    sort?: 1 | -1;
    limit?: number;
    page?: number;
    inventoryItemId?: string;
    operationType?: string;
    search?: string;
  }): Promise<{
    data: IStockMovement[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    // Build base filter
    const baseFilter: Record<string, any> = {};
    if (inventoryItemId) baseFilter["inventoryItem.id"] = inventoryItemId;
    if (operationType) baseFilter.operationType = operationType;

    // If search is provided, search by item name or performer name
    if (search) {
      const searchFilter: any[] = [];
      searchFilter.push(
        { "inventoryItem.name": { $regex: search, $options: "i" } },
        { "performer.name": { $regex: search, $options: "i" } }
      );

      const searchQuery = {
        ...baseFilter,
        $or: searchFilter,
      };

      // Get total count
      const total = await StockMovement.countDocuments(searchQuery);

      // Fetch data
      const data = await StockMovement.find(searchQuery)
        .sort({ _id: sort })
        .limit(limit)
        .skip(skip);

      return {
        data,
        total,
        page,
        limit,
      };
    }

    // If no search, use simple find query
    const [data, total] = await Promise.all([
      StockMovement.find(baseFilter)
        .sort({ _id: sort })
        .limit(limit)
        .skip(skip),
      StockMovement.countDocuments(baseFilter),
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
    // Get the inventory item to create snapshot
    const item = await InventoryItem.findOne({
      _id: data.inventoryItemId,
      isDeleted: { $ne: true },
    });

    if (!item) {
      throw new Error("Inventory item not found");
    }

    // Normalize expiry date to first day of month
    const normalizedExpiryDate = normalizeExpiryDate(data.expiryDate);

    // Create stock movement with operationType: "add"
    // Calculate balance BEFORE creating entry
    const currentStock = item.currentStockInBaseUnits ?? 0;
    const quantityToAdd = Math.abs(data.quantityInBaseUnits);
    const nextStock = currentStock + quantityToAdd;

    const entry = await StockMovement.create({
      inventoryItem: {
        id: item._id,
        name: item.name,
      },
      operationType: "add",
      supplier: data.supplier || null,
      prices: {
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
      },
      expiryDate: normalizedExpiryDate || data.expiryDate,
      quantityInBaseUnits: quantityToAdd,
      balance: nextStock,
      performer: {
        id: performerId,
        name: performerName,
      },
    });

    // Update inventory item stock
    item.currentStockInBaseUnits = nextStock;

    // Update earliestExpiryDate if this new stock has an earlier expiry
    const newExpiryDate = normalizedExpiryDate || data.expiryDate;
    const currentEarliestExpiry = item.earliestExpiryDate;

    if (!currentEarliestExpiry || newExpiryDate < currentEarliestExpiry) {
      item.earliestExpiryDate = newExpiryDate;
    }

    await item.save();

    return entry;
  }

  async reduceStock(
    data: ReduceStockRequest,
    performerId: Types.ObjectId,
    performerName: string
  ): Promise<IStockMovement> {
    // Get the inventory item to create snapshot
    const item = await InventoryItem.findOne({
      _id: data.inventoryItemId,
      isDeleted: { $ne: true },
    });

    if (!item) {
      throw new Error("Inventory item not found");
    }

    // Normalize expiry date to first day of month if provided
    const normalizedExpiryDate = data.expiryDate
      ? normalizeExpiryDate(data.expiryDate)
      : null;

    // Calculate balance BEFORE creating entry
    const currentStock = item.currentStockInBaseUnits ?? 0;
    const quantityToReduce = Math.abs(data.quantityInBaseUnits);
    const nextStock = currentStock - quantityToReduce;
    const finalStock = Math.max(0, nextStock);

    // Create stock movement with operationType: "reduce"
    const entry = await StockMovement.create({
      inventoryItem: {
        id: item._id,
        name: item.name,
      },
      operationType: "reduce",
      supplier: data.supplier || null,
      prices:
        data.costPrice != null && data.sellingPrice != null
          ? {
              costPrice: data.costPrice,
              sellingPrice: data.sellingPrice,
            }
          : null,
      expiryDate:
        normalizedExpiryDate ??
        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      quantityInBaseUnits: quantityToReduce,
      balance: finalStock,
      performer: {
        id: performerId,
        name: performerName,
      },
    });

    // Update inventory item stock
    item.currentStockInBaseUnits = finalStock;

    // If we have stock left, recalculate earliestExpiryDate
    // (in case we consumed the earliest expiring stock)
    if (finalStock > 0) {
      const inventoryItemsService = (
        await import("../inventory-items/inventory-items.service")
      ).default;
      item.earliestExpiryDate =
        await inventoryItemsService.recalculateEarliestExpiryDate(item._id);
    } else {
      // No stock left, clear the expiry date
      item.earliestExpiryDate = null;
    }

    await item.save();

    return entry;
  }

  async findById(id: string): Promise<IStockMovement | null> {
    return StockMovement.findById(id);
  }

  async create(data: StockMovementRequest): Promise<IStockMovement> {
    // Get the inventory item to create snapshot
    const item = await InventoryItem.findOne({
      _id: data.inventoryItem.id,
      isDeleted: { $ne: true },
    });

    if (!item) {
      throw new Error("Inventory item not found");
    }

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

    // Ensure quantity is stored as positive in the database for clarity
    const quantityToStore = Math.abs(data.quantityInBaseUnits);

    // Create stock movement
    // Calculate balance BEFORE creating entry
    const currentStock = item.currentStockInBaseUnits ?? 0;
    // For reduce operations, subtract the quantity; for add, add it
    const quantityDelta =
      data.operationType === "reduce" ? -quantityToStore : quantityToStore;
    const nextStock = currentStock + quantityDelta;

    const entry = await StockMovement.create({
      inventoryItem: {
        id: item._id,
        name: item.name,
      },
      operationType: data.operationType,
      supplier: data.supplier || null,
      prices: data.prices || null,
      expiryDate: normalizedExpiryDate || data.expiryDate,
      quantityInBaseUnits: quantityToStore,
      balance: nextStock,
      performer: data.performer,
    });

    // Update inventory item stock
    item.currentStockInBaseUnits = nextStock;
    await item.save();

    return entry;
  }
}

const stockMovementService = new StockMovementService();

export default stockMovementService;
