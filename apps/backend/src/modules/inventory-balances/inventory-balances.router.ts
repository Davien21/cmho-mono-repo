import express from "express";
const router = express.Router();

import { authenticate } from "../../middlewares/authentication";
import {
  processInventoryBalance,
  getStagedItems,
  deleteStagedItem,
} from "./inventory-balances.controller";

router.get(
  "/inventory-balances/staged",
  [authenticate],
  getStagedItems
);

router.post(
  "/inventory-balances/process",
  [authenticate],
  processInventoryBalance
);

router.delete(
  "/inventory-balances/staged/:id",
  [authenticate],
  deleteStagedItem
);

export default router;

