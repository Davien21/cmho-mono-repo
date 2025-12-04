import InventoryCategory from "./inventory-categories.model";
import {
  IInventoryCategory,
  IInventoryCategoryRequest,
  IInventoryCategoryWithUnitPresetsPopulated,
  IInventoryCategoryUnitPresetPopulated,
} from "./inventory-categories.types";

class InventoryCategoriesService {
  list(): Promise<IInventoryCategoryWithUnitPresetsPopulated[]> {
    // Return categories sorted by order with populated unit presets,
    // while also normalizing the response so `unitPresetIds` remains
    // a string[] and we expose a separate `unitPresets` array.
    return InventoryCategory.find({ isDeleted: { $ne: true } })
      .sort({ order: 1, createdAt: -1 })
      .populate("unitPresetIds")
      .lean()
      .then((categories: any[]): IInventoryCategoryWithUnitPresetsPopulated[] =>
        categories.map((rawCategory: any) => {
          const category = rawCategory as IInventoryCategory & {
            unitPresetIds?: IInventoryCategoryUnitPresetPopulated[];
          };
          const populatedPresets = category.unitPresetIds ?? [];

          return {
            ...category,
            // Ensure unitPresetIds stays as an array of string ids
            unitPresetIds: populatedPresets.map((preset) =>
              preset._id.toString()
            ),
            // New populated field with basic unit info
            unitPresets: populatedPresets,
          };
        })
      );
  }

  async create(data: IInventoryCategoryRequest): Promise<IInventoryCategory> {
    // Assign order based on count of non-deleted items
    const order = await InventoryCategory.countDocuments({
      isDeleted: { $ne: true },
    });
    return InventoryCategory.create({ ...data, order });
  }

  update(
    id: string,
    data: Partial<IInventoryCategoryRequest>
  ): Promise<IInventoryCategory | null> {
    return InventoryCategory.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      data,
      { new: true }
    );
  }

  delete(id: string): Promise<IInventoryCategory | null> {
    return InventoryCategory.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
  }

  reorder(categoryOrders: Array<{ id: string; order: number }>): Promise<void> {
    // Single bulk update: Since we're updating ALL categories with new sequential orders (0, 1, 2, ...)
    // and the frontend prevents concurrent updates, a single bulk write is sufficient.
    // Each document update is atomic, and the operation completes in milliseconds.
    const bulkOps = categoryOrders.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order } },
      },
    }));

    return InventoryCategory.bulkWrite(bulkOps).then(() => undefined);
  }
}

const inventoryCategoriesService = new InventoryCategoriesService();

export default inventoryCategoriesService;
