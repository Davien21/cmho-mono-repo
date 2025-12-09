import express from "express";
const router = express.Router();

import { authenticate, hasRole } from "../../middlewares/authentication";
import { AdminRole } from "../admins/admins.types";
import validator from "../../middlewares/validator";
import {
  addStock,
  getStockMovement,
  reduceStock,
} from "./stock-movement.controller";
import {
  addStockSchema,
  getStockMovementSchema,
  reduceStockSchema,
} from "./stock-movement.validators";

router.get(
  "/inventory/stock-movement",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(getStockMovementSchema, "query"),
  ],
  getStockMovement
);

// Route for adding stock
router.post(
  "/inventory/stock-movement/add",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(addStockSchema),
  ],
  addStock
);

// Separate route for reducing stock
router.post(
  "/inventory/stock-movement/reduce",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(reduceStockSchema),
  ],
  reduceStock
);

export default router;

