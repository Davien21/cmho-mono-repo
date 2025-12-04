import InventoryUnit from "./inventory-units.model";
import {
  IInventoryUnitDefinition,
  IInventoryUnitDefinitionRequest,
} from "./inventory-units.types";

class InventoryUnitsService {
  list() {
    return InventoryUnit.find({ isDeleted: { $ne: true } }).sort({
      order: 1,
      createdAt: -1,
    });
  }

  async create(
    data: IInventoryUnitDefinitionRequest
  ): Promise<IInventoryUnitDefinition> {
    // Assign order based on count of non-deleted items
    const order = await InventoryUnit.countDocuments({
      isDeleted: { $ne: true },
    });
    return InventoryUnit.create({ ...data, order });
  }

  update(
    id: string,
    data: Partial<IInventoryUnitDefinitionRequest>
  ): Promise<IInventoryUnitDefinition | null> {
    return InventoryUnit.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      data,
      { new: true }
    );
  }

  delete(id: string): Promise<IInventoryUnitDefinition | null> {
    return InventoryUnit.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
  }

  reorder(unitOrders: Array<{ id: string; order: number }>): Promise<void> {
    // Single bulk update: Since we're updating ALL units with new sequential orders (0, 1, 2, ...)
    // and the frontend prevents concurrent updates, a single bulk write is sufficient.
    // Each document update is atomic, and the operation completes in milliseconds.
    const bulkOps = unitOrders.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order } },
      },
    }));

    return InventoryUnit.bulkWrite(bulkOps).then(() => undefined);
  }
}

const inventoryUnitsService = new InventoryUnitsService();

export default inventoryUnitsService;
