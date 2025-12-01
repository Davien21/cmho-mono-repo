import { Request, Response } from 'express';
import inventoryUnitsService from './inventory-units.service';
import { errorResponse, successResponse } from '../../utils/response';
import { IInventoryUnitDefinitionRequest } from './inventory-units.types';

export async function getInventoryUnits(_req: Request, res: Response) {
  try {
    const units = await inventoryUnitsService.list();
    res.send(successResponse('Inventory units fetched successfully', units));
  } catch (error) {
    res.status(500).send(errorResponse('Failed to fetch inventory units'));
  }
}

export async function createInventoryUnit(req: Request, res: Response) {
  try {
    const data = req.body as IInventoryUnitDefinitionRequest;
    const unit = await inventoryUnitsService.create(data);
    res.send(successResponse('Inventory unit created successfully', unit));
  } catch (error) {
    res.status(500).send(errorResponse('Failed to create inventory unit'));
  }
}

export async function updateInventoryUnit(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body as Partial<IInventoryUnitDefinitionRequest>;

    const unit = await inventoryUnitsService.update(id, data);

    res.send(successResponse('Inventory unit updated successfully', unit));
  } catch (error) {
    res.status(500).send(errorResponse('Failed to update inventory unit'));
  }
}

export async function deleteInventoryUnit(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await inventoryUnitsService.delete(id);
    res.send(successResponse('Inventory unit deleted successfully'));
  } catch (error) {
    res.status(500).send(errorResponse('Failed to delete inventory unit'));
  }
}
