import express from "express";
const router = express.Router();

import { authenticate, hasRole } from "../../middlewares/authentication";
import { AdminRole } from "../admins/admins.types";
import validator from "../../middlewares/validator";
import { createStockEntry, getStockEntries } from "./stock-entries.controller";
import {
  createStockEntrySchema,
  getStockEntriesSchema,
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

router.post(
  "/inventory/stock-entries",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(createStockEntrySchema),
  ],
  createStockEntry
);

export default router;
