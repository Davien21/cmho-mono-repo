import { Request, Response } from "express";
import suppliersService from "./suppliers.service";
import { successResponse } from "../../utils/response";
import { SupplierRequest } from "./suppliers.types";

export async function getSuppliers(_req: Request, res: Response) {
  const suppliers = await suppliersService.list();
  res.send(successResponse("Suppliers fetched successfully", suppliers));
}

export async function createSupplier(req: Request, res: Response) {
  const data = req.body as SupplierRequest;
  const supplier = await suppliersService.create(data);
  res.send(successResponse("Supplier created successfully", supplier));
}

export async function updateSupplier(req: Request, res: Response) {
  const { id } = req.params;
  const data = req.body as Partial<SupplierRequest>;

  const supplier = await suppliersService.update(id, data);

  res.send(successResponse("Supplier updated successfully", supplier));
}

export async function deleteSupplier(req: Request, res: Response) {
  const { id } = req.params;
  await suppliersService.delete(id);
  res.send(successResponse("Supplier deleted successfully"));
}
