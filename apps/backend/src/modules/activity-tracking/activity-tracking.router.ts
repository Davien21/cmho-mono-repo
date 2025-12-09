import express from "express";
const router = express.Router();

import { authenticate } from "../../middlewares/authentication";
import { getActivities } from "./activity-tracking.controller";
import { getActivitiesQuerySchema } from "./activity-tracking.validator";
import validator from "../../middlewares/validator";

router.get(
  "/activities",
  [authenticate, validator(getActivitiesQuerySchema, "query")],
  getActivities
);

export default router;
