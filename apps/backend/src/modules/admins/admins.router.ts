import express from "express";
const router = express.Router();

import { authenticate } from "../../middlewares/authentication";
import {
  createAdmin,
  getAdmins,
  updateAdmin,
  disableAdmin,
} from "./admins.controller";
import validator from "../../middlewares/validator";
import {
  createAdminSchema,
  getAdminsSchema,
  updateAdminSchema,
} from "./admins.validators";

router.get(
  "/admins",
  authenticate,
  validator(getAdminsSchema, "query"),
  getAdmins
);
router.post("/admins", authenticate, validator(createAdminSchema), createAdmin);

router.put(
  "/admins/:id",
  authenticate,
  validator(updateAdminSchema),
  updateAdmin
);

router.patch("/admins/:id/disable", authenticate, disableAdmin);

export default router;
