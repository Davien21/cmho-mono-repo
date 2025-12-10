import express from "express";
const router = express.Router();

import { authenticate, hasRole } from "../../middlewares/authentication";
import { AdminRole } from "../admins/admins.types";
import { getNotifications } from "./trigger_notifications.controller";
import validator from "../../middlewares/validator";
import { getNotificationsQuerySchema } from "./trigger_notifications.validators";

router.get(
  "/notifications",
  [
    authenticate,
    hasRole(AdminRole.ADMIN_MANAGER),
    validator(getNotificationsQuerySchema, "query"),
  ],
  getNotifications
);

export default router;
