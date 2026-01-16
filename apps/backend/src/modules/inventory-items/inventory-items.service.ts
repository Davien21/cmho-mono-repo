import InventoryItem from "./inventory-items.model.js";
import {
  IInventoryItem,
  IInventoryItemRequest,
} from "./inventory-items.types.js";
import mediaService from "../media/media.service.js";
import algoliaInventoryService from "../../services/algolia.service.js";
import { Types } from "mongoose";

class InventoryItemsService {
  async list({
    sort = -1,
    limit = 10,
    page = 1,
    status,
    category,
    search,
    stockFilter,
  }: {
    sort?: 1 | -1;
    limit?: number;
    page?: number;
    status?: string;
    category?: string;
    search?: string;
    stockFilter?: "outOfStock" | "lowStock" | "inStock" | "expired";
  }): Promise<{
    data: IInventoryItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const now = new Date();

    const filter: Record<string, any> = { isDeleted: { $ne: true } };
    if (status) filter.status = status;

    // Handle category filter - match against embedded category.name
    if (category) {
      filter["category.name"] = category;
    }

    // Build the aggregation pipeline without pagination first to get total count
    const basePipeline: any[] = [
      { $match: filter },
      // Handle search - search by item name or category name
      ...(search && !category
        ? [
            {
              $match: {
                $or: [
                  { name: { $regex: search, $options: "i" } },
                  { "category.name": { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : search && category
        ? [
            {
              $match: {
                name: { $regex: search, $options: "i" },
              },
            },
          ]
        : []),
      // Apply stock filter if provided
      ...(stockFilter
        ? [
            {
              $match: (() => {
                switch (stockFilter) {
                  case "outOfStock":
                    return { currentStockInBaseUnits: { $eq: 0 } };
                  case "lowStock":
                    return {
                      $and: [
                        { currentStockInBaseUnits: { $gt: 0 } },
                        {
                          $expr: {
                            $lte: [
                              "$currentStockInBaseUnits",
                              "$lowStockValue",
                            ],
                          },
                        },
                      ],
                    };
                  case "inStock":
                    return {
                      $and: [
                        { currentStockInBaseUnits: { $gt: 0 } },
                        {
                          $expr: {
                            $gt: ["$currentStockInBaseUnits", "$lowStockValue"],
                          },
                        },
                      ],
                    };
                  case "expired":
                    return {
                      $and: [
                        { earliestExpiryDate: { $ne: null } },
                        { earliestExpiryDate: { $lt: now } },
                        { currentStockInBaseUnits: { $gt: 0 } },
                      ],
                    };
                  default:
                    return {};
                }
              })(),
            },
          ]
        : []),
    ];

    // Execute aggregation with facet to get both count and data
    const result = await InventoryItem.aggregate([
      ...basePipeline,
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $sort: { _id: sort } }, { $skip: skip }, { $limit: limit }],
        },
      },
    ]);

    const total = result[0]?.metadata[0]?.total || 0;
    const items = result[0]?.data || [];

    return {
      data: items as IInventoryItem[],
      total,
      page,
      limit,
    };
  }

  async autocompleteSearch({
    query,
    limit = 20,
  }: {
    query: string;
    limit?: number;
  }): Promise<Array<{ _id: string; name: string; category: string }>> {
    // Use Algolia for fast, typo-tolerant autocomplete search
    return await algoliaInventoryService.search(query, limit);
  }

  async create(data: IInventoryItemRequest): Promise<IInventoryItem> {
    const item = await InventoryItem.create(data);

    // Index in Algolia for search
    await algoliaInventoryService.indexItem(item);

    // If image is attached, check if media item needs renaming
    if (data.image?.mediaId) {
      await this.updateMediaItemNameIfNeeded(data.image.mediaId, data.name);
    }

    return item;
  }

  async update(
    id: string,
    data: Partial<IInventoryItemRequest>
  ): Promise<IInventoryItem | null> {
    const item = await InventoryItem.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      data,
      { new: true }
    );

    // Reindex in Algolia if item was updated successfully
    if (item) {
      await algoliaInventoryService.indexItem(item);
    }

    // If image is attached, check if media item needs renaming
    // Use the new name if provided, otherwise use the existing item name
    if (data.image?.mediaId && item) {
      const inventoryItemName = data.name || item.name;
      await this.updateMediaItemNameIfNeeded(
        data.image.mediaId,
        inventoryItemName
      );
    }

    return item;
  }

  /**
   * Updates media item name if it starts with "cmho_temp" or "cmho-temp_"
   * to match the inventory item name
   */
  private async updateMediaItemNameIfNeeded(
    mediaId: string,
    inventoryItemName: string
  ): Promise<void> {
    try {
      const mediaItem = await mediaService.findById(mediaId);

      if (mediaItem && mediaItem.name) {
        // Check if name starts with "cmho_temp" or "cmho-temp_"
        const name = mediaItem.name.trim();
        if (name.startsWith("cmho_temp") || name.startsWith("cmho-temp_")) {
          // Update media item name to match inventory item name
          await mediaService.update(mediaItem._id.toString(), {
            name: inventoryItemName,
          });
        }
      }
    } catch (error) {
      // Log error but don't fail the inventory item operation
      console.error("Error updating media item name:", error);
    }
  }

  async findById(id: string | Types.ObjectId): Promise<IInventoryItem | null> {
    return InventoryItem.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });
  }

  async delete(id: string): Promise<IInventoryItem | null> {
    const item = await InventoryItem.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    // Remove from Algolia index
    if (item) {
      await algoliaInventoryService.deleteItem(id);
    }

    return item;
  }

  /**
   * Recalculates and updates the earliestExpiryDate for an inventory item
   * by querying stock movements with "add" operations and future expiry dates
   */
  async recalculateEarliestExpiryDate(
    itemId: string | Types.ObjectId
  ): Promise<Date | null> {
    const StockMovement = (
      await import("../stock-movement/stock-movement.model")
    ).default;

    const now = new Date();

    // Find the earliest expiry date from "add" stock movements that haven't expired
    const earliestEntry = await StockMovement.findOne({
      "inventoryItem.id": itemId,
      operationType: "add",
      expiryDate: { $gte: now },
    })
      .sort({ expiryDate: 1 })
      .select("expiryDate")
      .lean();

    const earliestExpiryDate = earliestEntry?.expiryDate || null;

    // Update the inventory item
    await InventoryItem.findByIdAndUpdate(itemId, { earliestExpiryDate });

    return earliestExpiryDate;
  }

  /**
   * Get dashboard statistics for inventory items
   * Returns counts for total items, in stock, low stock, out of stock, and expired
   */
  async getDashboardStats(): Promise<{
    totalItems: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    expiredItems: number;
  }> {
    const now = new Date();

    const result = await InventoryItem.aggregate([
      // Filter out deleted items
      { $match: { isDeleted: { $ne: true } } },
      {
        $facet: {
          totalItems: [{ $count: "count" }],
          outOfStock: [
            { $match: { currentStockInBaseUnits: { $eq: 0 } } },
            { $count: "count" },
          ],
          lowStock: [
            {
              $match: {
                $and: [
                  { currentStockInBaseUnits: { $gt: 0 } },
                  {
                    $expr: {
                      $lt: ["$currentStockInBaseUnits", "$lowStockValue"],
                    },
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          inStock: [
            {
              $match: {
                $and: [
                  { currentStockInBaseUnits: { $gt: 0 } },
                  {
                    $expr: {
                      $gte: ["$currentStockInBaseUnits", "$lowStockValue"],
                    },
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          expiredItems: [
            {
              $match: {
                $and: [
                  { earliestExpiryDate: { $ne: null } },
                  { earliestExpiryDate: { $lt: now } },
                  { currentStockInBaseUnits: { $gt: 0 } },
                ],
              },
            },
            { $count: "count" },
          ],
        },
      },
    ]);

    const stats = result[0];

    return {
      totalItems: stats.totalItems[0]?.count || 0,
      outOfStock: stats.outOfStock[0]?.count || 0,
      lowStock: stats.lowStock[0]?.count || 0,
      inStock: stats.inStock[0]?.count || 0,
      expiredItems: stats.expiredItems[0]?.count || 0,
    };
  }
}

const inventoryItemsService = new InventoryItemsService();

export default inventoryItemsService;
