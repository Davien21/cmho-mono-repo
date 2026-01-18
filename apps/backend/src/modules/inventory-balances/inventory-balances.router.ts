import express from "express";
const router = express.Router();

import { authenticate } from "../../middlewares/authentication";
import {
  processInventoryBalance,
  getStagedItems,
  getStagedItemsByMediaId,
  deleteStagedItem,
} from "./inventory-balances.controller";

router.get(
  "/inventory-balances/staged",
  [authenticate],
  getStagedItems
);

router.get(
  "/inventory-balances/staged/media/:media_id",
  [authenticate],
  getStagedItemsByMediaId
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

