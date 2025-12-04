import express from "express";
const router = express.Router();

import { authenticate, hasRole, requireSuperAdmin } from "../../middlewares/authentication";
import { AdminRole } from "../admins/admins.types";
import validator from "../../middlewares/validator";
import {
  createInventoryItem,
  deleteInventoryItem,
  getInventoryItems,
  updateInventoryItem,
} from "./inventory-items.controller";
import {
  createInventoryItemSchema,
  getInventoryItemsSchema,
  updateInventoryItemSchema,
} from "./inventory-items.validators";

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
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(updateInventoryItemSchema),
  ],
  updateInventoryItem
);

router.delete(
  "/inventory/items/:id",
  [authenticate, requireSuperAdmin],
  deleteInventoryItem
);

export default router;
