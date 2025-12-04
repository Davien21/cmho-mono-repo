import InventoryItem from "./inventory-items.model";
import { IInventoryItem, IInventoryItemRequest } from "./inventory-items.types";
import galleryService from "../gallery/gallery.service";

class InventoryItemsService {
  async list({
    sort = -1,
    limit = 10,
    page = 1,
    status,
    setupStatus,
    category,
    search,
  }: {
    sort?: 1 | -1;
    limit?: number;
    page?: number;
    status?: string;
    setupStatus?: string;
    category?: string;
    search?: string;
  }): Promise<IInventoryItem[]> {
    const skip = (page - 1) * limit;
    const now = new Date();

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (setupStatus) filter.setupStatus = setupStatus;
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };

    // Use aggregation to calculate earliest expiry date dynamically from stock entries
    const items = await InventoryItem.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "stock_entries",
          let: { itemId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$inventoryItemId", "$$itemId"] },
                    { $eq: ["$operationType", "add"] },
                    { $gte: ["$expiryDate", now] },
                  ],
                },
              },
            },
            { $sort: { expiryDate: 1 } },
            { $limit: 1 },
            { $project: { expiryDate: 1 } },
          ],
          as: "earliestExpiryEntry",
        },
      },
      {
        $lookup: {
          from: "stock_entries",
          let: { itemId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$inventoryItemId", "$$itemId"] },
                    { $eq: ["$operationType", "add"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "hasAnyStockEntries",
        },
      },
      {
        $addFields: {
          earliestExpiryDate: {
            $cond: {
              if: { $gt: [{ $size: "$earliestExpiryEntry" }, 0] },
              then: { $arrayElemAt: ["$earliestExpiryEntry.expiryDate", 0] },
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $gt: [{ $size: "$hasAnyStockEntries" }, 0] },
                      { $gt: ["$currentStockInBaseUnits", 0] },
                    ],
                  },
                  then: "ALL EXPIRED",
                  else: null,
                },
              },
            },
          },
        },
      },
      { $unset: ["earliestExpiryEntry", "hasAnyStockEntries"] },
      { $sort: { _id: sort } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Aggregation returns plain objects that match IInventoryItem interface
    return items as IInventoryItem[];
  }

  async create(data: IInventoryItemRequest): Promise<IInventoryItem> {
    const item = await InventoryItem.create(data);

    // If image is attached, check if gallery item needs renaming
    if (data.image?.mediaId) {
      await this.updateGalleryItemNameIfNeeded(data.image.mediaId, data.name);
    }

    return item;
  }

  async update(
    id: string,
    data: Partial<IInventoryItemRequest>
  ): Promise<IInventoryItem | null> {
    const item = await InventoryItem.findByIdAndUpdate(id, data, { new: true });

    // If image is attached, check if gallery item needs renaming
    // Use the new name if provided, otherwise use the existing item name
    if (data.image?.mediaId && item) {
      const inventoryItemName = data.name || item.name;
      await this.updateGalleryItemNameIfNeeded(
        data.image.mediaId,
        inventoryItemName
      );
    }

    return item;
  }

  /**
   * Updates gallery item name if it starts with "cmho_temp" or "cmho-temp_"
   * to match the inventory item name
   */
  private async updateGalleryItemNameIfNeeded(
    mediaId: string,
    inventoryItemName: string
  ): Promise<void> {
    try {
      const galleryItem = await galleryService.findByMediaId(mediaId);

      if (galleryItem && galleryItem.name) {
        // Check if name starts with "cmho_temp" or "cmho-temp_"
        const name = galleryItem.name.trim();
        if (name.startsWith("cmho_temp") || name.startsWith("cmho-temp_")) {
          // Update gallery item name to match inventory item name
          await galleryService.update(galleryItem._id.toString(), {
            name: inventoryItemName,
          });
        }
      }
    } catch (error) {
      // Log error but don't fail the inventory item operation
      console.error("Error updating gallery item name:", error);
    }
  }

  async delete(id: string): Promise<IInventoryItem | null> {
    return InventoryItem.findByIdAndDelete(id);
  }
}

const inventoryItemsService = new InventoryItemsService();

export default inventoryItemsService;
