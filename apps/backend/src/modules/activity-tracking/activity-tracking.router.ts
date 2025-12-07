import express from "express";
const router = express.Router();

import { authenticate, hasRole } from "../../middlewares/authentication";
import { AdminRole } from "../admins/admins.types";
import { getActivities } from "./activity-tracking.controller";

router.get(
  "/activities",
  [authenticate, hasRole(AdminRole.ADMIN_MANAGER)],
  getActivities
);

export default router;

