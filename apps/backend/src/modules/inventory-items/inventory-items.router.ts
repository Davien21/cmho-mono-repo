import express from "express";
const router = express.Router();

import {
  authenticate,
  hasRole,
  requireSuperAdmin,
} from "../../middlewares/authentication";
import { AdminRole } from "../admins/admins.types";
import validator from "../../middlewares/validator";
import {
  createInventoryItem,
  deleteInventoryItem,
  getDashboardStats,
  getInventoryItems,
  updateInventoryItem,
} from "./inventory-items.controller";
import {
  createInventoryItemSchema,
  getInventoryItemsSchema,
  updateInventoryItemSchema,
} from "./inventory-items.validators";
import validateById from "../../middlewares/validateById";

router.get(
  "/inventory/dashboard/stats",
  [authenticate, hasRole(AdminRole.INVENTORY_MANAGER)],
  getDashboardStats
);

router.get(
  "/inventory/items",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(getInventoryItemsSchema, "query"),
  ],
  getInventoryItems
);

router.post(
  "/inventory/items",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(createInventoryItemSchema),
  ],
  createInventoryItem
);

router.put(
  "/inventory/items/:id",
  [
    authenticate,
    validateById("Invalid inventory item id"),
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(updateInventoryItemSchema),
  ],
  updateInventoryItem
);

router.delete(
  "/inventory/items/:id",
  [authenticate, validateById("Invalid inventory item id"), requireSuperAdmin],
  deleteInventoryItem
);

export default router;
