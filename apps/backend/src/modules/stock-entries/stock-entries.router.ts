import express from "express";
const router = express.Router();

import { authenticate, hasRole } from "../../middlewares/authentication";
import { AdminRole } from "../admins/admins.types";
import validator from "../../middlewares/validator";
import {
  addStock,
  createStockEntry,
  getStockEntries,
  reduceStock,
} from "./stock-entries.controller";
import {
  addStockSchema,
  createStockEntrySchema,
  getStockEntriesSchema,
  reduceStockSchema,
} from "./stock-entries.validators";

router.get(
  "/inventory/stock-entries",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(getStockEntriesSchema, "query"),
  ],
  getStockEntries
);

// Legacy route for backward compatibility
router.post(
  "/inventory/stock-entries",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(createStockEntrySchema),
  ],
  createStockEntry
);

// Separate route for adding stock
router.post(
  "/inventory/stock-entries/add",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(addStockSchema),
  ],
  addStock
);

// Separate route for reducing stock
router.post(
  "/inventory/stock-entries/reduce",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(reduceStockSchema),
  ],
  reduceStock
);

export default router;
