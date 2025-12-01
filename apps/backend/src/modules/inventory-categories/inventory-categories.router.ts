import express from 'express';
const router = express.Router();

import { authenticate, hasRole } from '../../middlewares/authentication';
import { AdminRole } from '../admins/admins.types';
import validator from '../../middlewares/validator';
import {
  createInventoryCategory,
  deleteInventoryCategory,
  getInventoryCategories,
  updateInventoryCategory,
} from './inventory-categories.controller';
import {
  createInventoryCategorySchema,
  updateInventoryCategorySchema,
} from './inventory-categories.validators';

router.get('/inventory/categories', [
  authenticate,
  hasRole(AdminRole.INVENTORY_MANAGER),
  getInventoryCategories,
]);

router.post(
  '/inventory/categories',
  [authenticate, hasRole(AdminRole.INVENTORY_MANAGER), validator(createInventoryCategorySchema)],
  createInventoryCategory
);

router.put(
  '/inventory/categories/:id',
  [authenticate, hasRole(AdminRole.INVENTORY_MANAGER), validator(updateInventoryCategorySchema)],
  updateInventoryCategory
);

router.delete(
  '/inventory/categories/:id',
  [authenticate, hasRole(AdminRole.INVENTORY_MANAGER)],
  deleteInventoryCategory
);

export default router;
