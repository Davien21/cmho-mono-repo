import InventoryCategory from "./inventory-categories.model";
import {
  IInventoryCategory,
  IInventoryCategoryRequest,
} from "./inventory-categories.types";

class InventoryCategoriesService {
  list() {
    return InventoryCategory.find().sort({ name: 1 });
  }

  create(data: IInventoryCategoryRequest): Promise<IInventoryCategory> {
    return InventoryCategory.create(data);
  }

  update(
    id: string,
    data: Partial<IInventoryCategoryRequest>
  ): Promise<IInventoryCategory | null> {
    return InventoryCategory.findByIdAndUpdate(id, data, { new: true });
  }

  delete(id: string): Promise<IInventoryCategory | null> {
    return InventoryCategory.findByIdAndDelete(id);
  }
}

const inventoryCategoriesService = new InventoryCategoriesService();

export default inventoryCategoriesService;
