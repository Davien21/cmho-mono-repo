import express from "express";
const router = express.Router();

import { authenticate, hasRole } from "../../middlewares/authentication";
import { AdminRole } from "../admins/admins.types";
import { getNotifications } from "./notifications.controller";

router.get(
  "/notifications",
  [authenticate, hasRole(AdminRole.ADMIN_MANAGER)],
  getNotifications
);

export default router;

