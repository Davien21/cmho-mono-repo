import express from "express";
const router = express.Router();

import { authenticate, hasRole, requireSuperAdmin } from "../../middlewares/authentication";
import { AdminRole } from "../admins/admins.types";
import validator from "../../middlewares/validator";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "./suppliers.controller";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "./suppliers.validators";

router.get("/inventory/suppliers", [
  authenticate,
  hasRole(AdminRole.INVENTORY_MANAGER),
  getSuppliers,
]);

router.post(
  "/inventory/suppliers",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(createSupplierSchema),
  ],
  createSupplier
);

router.put(
  "/inventory/suppliers/:id",
  [
    authenticate,
    hasRole(AdminRole.INVENTORY_MANAGER),
    validator(updateSupplierSchema),
  ],
  updateSupplier
);

router.delete(
  "/inventory/suppliers/:id",
  [authenticate, requireSuperAdmin],
  deleteSupplier
);

export default router;
