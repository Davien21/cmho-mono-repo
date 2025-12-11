import express from "express";
const router = express.Router();

import { authenticate, hasRole } from "../../middlewares/authentication";
import { AdminRole } from "../admins/admins.types";
import validator from "../../middlewares/validator";
import {
  createInventoryUnit,
  deleteInventoryUnit,
  getInventoryUnits,
  updateInventoryUnit,
  reorderInventoryUnits,
} from "./inventory-units.controller";
import {
  createInventoryUnitSchema,
  updateInventoryUnitSchema,
  reorderInventoryUnitsSchema,
} from "./inventory-units.validators";

router.get("/inventory/units", [
  authenticate,
  hasRole(AdminRole.INVENTORY_MANAGER),
  getInventoryUnits,
]);

router.post(
  "/inventory/units",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(createInventoryUnitSchema),
  ],
  createInventoryUnit
);

router.put(
  "/inventory/units/:id",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(updateInventoryUnitSchema),
  ],
  updateInventoryUnit
);

router.delete(
  "/inventory/units/:id",
  [authenticate, hasRole(AdminRole.INVENTORY_EDITOR)],
  deleteInventoryUnit
);

router.post(
  "/inventory/units/reorder",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(reorderInventoryUnitsSchema),
  ],
  reorderInventoryUnits
);

export default router;
