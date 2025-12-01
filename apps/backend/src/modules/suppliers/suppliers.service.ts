import Supplier from './suppliers.model';
import { ISupplier, SupplierRequest } from './suppliers.types';

class SuppliersService {
  list() {
    return Supplier.find().sort({ name: 1 });
  }

  create(data: SupplierRequest): Promise<ISupplier> {
    return Supplier.create(data);
  }

  update(id: string, data: Partial<SupplierRequest>): Promise<ISupplier | null> {
    return Supplier.findByIdAndUpdate(id, data, { new: true });
  }

  delete(id: string): Promise<ISupplier | null> {
    return Supplier.findByIdAndDelete(id);
  }
}

const suppliersService = new SuppliersService();

export default suppliersService;
