import InventoryCategory from './inventory-categories.model';
import {
  IInventoryCategory,
  IInventoryCategoryRequest,
  IInventoryCategoryWithUnitPresetsPopulated,
  IInventoryCategoryUnitPresetPopulated,
} from './inventory-categories.types';

class InventoryCategoriesService {
  list(): Promise<IInventoryCategoryWithUnitPresetsPopulated[]> {
    // Return categories sorted by name with populated unit presets,
    // while also normalizing the response so `unitPresetIds` remains
    // a string[] and we expose a separate `unitPresets` array.
    return InventoryCategory.find()
      .sort({ name: 1 })
      .populate('unitPresetIds')
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
            unitPresetIds: populatedPresets.map((preset) => preset._id.toString()),
            // New populated field with basic unit info
            unitPresets: populatedPresets,
          };
        })
      );
  }

  create(data: IInventoryCategoryRequest): Promise<IInventoryCategory> {
    return InventoryCategory.create(data);
  }

  update(id: string, data: Partial<IInventoryCategoryRequest>): Promise<IInventoryCategory | null> {
    return InventoryCategory.findByIdAndUpdate(id, data, { new: true });
  }

  delete(id: string): Promise<IInventoryCategory | null> {
    return InventoryCategory.findByIdAndDelete(id);
  }
}

const inventoryCategoriesService = new InventoryCategoriesService();

export default inventoryCategoriesService;
