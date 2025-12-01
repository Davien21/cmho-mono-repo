import InventoryItem from './inventory-items.model';
import { IInventoryItem, IInventoryItemRequest } from './inventory-items.types';

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

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (setupStatus) filter.setupStatus = setupStatus;
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    return InventoryItem.find(filter).sort({ _id: sort }).limit(limit).skip(skip);
  }

  async create(data: IInventoryItemRequest): Promise<IInventoryItem> {
    return InventoryItem.create(data);
  }

  async update(id: string, data: Partial<IInventoryItemRequest>): Promise<IInventoryItem | null> {
    return InventoryItem.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<IInventoryItem | null> {
    return InventoryItem.findByIdAndDelete(id);
  }
}

const inventoryItemsService = new InventoryItemsService();

export default inventoryItemsService;
