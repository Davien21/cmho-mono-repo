import express from "express";
const router = express.Router();

import { authenticate, hasRole } from "../../middlewares/authentication";
import { AdminRole } from "../admins/admins.types";
import validator from "../../middlewares/validator";
import { getInventoryItems } from "./inventory-items.controller";
import { getInventoryItemsSchema } from "./inventory-items.validators";

router.get(
  "/inventory/items",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(getInventoryItemsSchema, "query"),
  ],
  getInventoryItems
);

export default router;
