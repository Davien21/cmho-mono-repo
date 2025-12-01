import InventoryUnit from './inventory-units.model';
import { IInventoryUnitDefinition, IInventoryUnitDefinitionRequest } from './inventory-units.types';

class InventoryUnitsService {
  list() {
    return InventoryUnit.find().sort({ name: 1 });
  }

  create(data: IInventoryUnitDefinitionRequest): Promise<IInventoryUnitDefinition> {
    return InventoryUnit.create(data);
  }

  update(
    id: string,
    data: Partial<IInventoryUnitDefinitionRequest>
  ): Promise<IInventoryUnitDefinition | null> {
    return InventoryUnit.findByIdAndUpdate(id, data, { new: true });
  }

  delete(id: string): Promise<IInventoryUnitDefinition | null> {
    return InventoryUnit.findByIdAndDelete(id);
  }
}

const inventoryUnitsService = new InventoryUnitsService();

export default inventoryUnitsService;
