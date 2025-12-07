import Supplier from "./suppliers.model";
import { ISupplier, SupplierRequest } from "./suppliers.types";

class SuppliersService {
  list() {
    return Supplier.find({ isDeleted: { $ne: true } }).sort({ name: 1 });
  }

  create(data: SupplierRequest): Promise<ISupplier> {
    return Supplier.create(data);
  }

  findById(id: string): Promise<ISupplier | null> {
    return Supplier.findOne({ _id: id, isDeleted: { $ne: true } }).lean() as Promise<ISupplier | null>;
  }

  update(
    id: string,
    data: Partial<SupplierRequest>
  ): Promise<ISupplier | null> {
    return Supplier.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      data,
      { new: true }
    );
  }

  delete(id: string): Promise<ISupplier | null> {
    return Supplier.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
  }
}

const suppliersService = new SuppliersService();

export default suppliersService;
