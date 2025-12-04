import express from "express";
const router = express.Router();

import { authenticate, hasRole, requireSuperAdmin } from "../../middlewares/authentication";
import { AdminRole } from "../admins/admins.types";
import validator from "../../middlewares/validator";
import {
  createInventoryCategory,
  deleteInventoryCategory,
  getInventoryCategories,
  updateInventoryCategory,
  reorderInventoryCategories,
} from "./inventory-categories.controller";
import {
  createInventoryCategorySchema,
  updateInventoryCategorySchema,
  reorderInventoryCategoriesSchema,
} from "./inventory-categories.validators";

router.get("/inventory/categories", [
  authenticate,
  hasRole(AdminRole.INVENTORY_MANAGER),
  getInventoryCategories,
]);

router.post(
  "/inventory/categories",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(createInventoryCategorySchema),
  ],
  createInventoryCategory
);

router.put(
  "/inventory/categories/:id",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(updateInventoryCategorySchema),
  ],
  updateInventoryCategory
);

router.delete(
  "/inventory/categories/:id",
  [authenticate, requireSuperAdmin],
  deleteInventoryCategory
);

router.post(
  "/inventory/categories/reorder",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(reorderInventoryCategoriesSchema),
  ],
  reorderInventoryCategories
);

export default router;
