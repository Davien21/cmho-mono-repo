import express from "express";
const router = express.Router();

import { authenticate, hasRole } from "../../middlewares/authentication";
import { AdminRole } from "../admins/admins.types";
import validator from "../../middlewares/validator";
import {
  createInventoryItem,
  deleteInventoryItem,
  getDashboardStats,
  getInventoryItems,
  searchInventoryItems,
  updateInventoryItem,
} from "./inventory-items.controller";
import {
  createInventoryItemSchema,
  getInventoryItemsSchema,
  searchInventoryItemsSchema,
  updateInventoryItemSchema,
} from "./inventory-items.validators";
import validateById from "../../middlewares/validateById";

router.get(
  "/inventory/dashboard/stats",
  [authenticate, hasRole(AdminRole.INVENTORY_MANAGER)],
  getDashboardStats
);

router.get(
  "/inventory/items/search",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(searchInventoryItemsSchema, "query"),
  ],
  searchInventoryItems
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
  [
    authenticate,
    validateById("Invalid inventory item id"),
    hasRole(AdminRole.INVENTORY_EDITOR),
  ],
  deleteInventoryItem
);

export default router;
