import express from "express";
const router = express.Router();

import {
  initiateSingleTransfer,
  initiateBulkTransfers,
  getStoredTransfers,
  getTransactionsOnTransfer,
} from "./transfers.controller";
import { authenticate } from "../../middlewares/authentication";
import { runTransferSchema, transferQuerySchema } from "./transfers.validation";
import validator from "../../middlewares/validator";

// Transfer initiation routes
router.post(
  "/transfers/single",
  [authenticate, validator(runTransferSchema)],
  initiateSingleTransfer
);
router.post(
  "/transfers/multiple",
  [authenticate, validator(runTransferSchema)],
  initiateBulkTransfers
);

// Database transfer routes (internal database)
router.get(
  "/transfers",
  [authenticate, validator(transferQuerySchema, "query")],
  getStoredTransfers
);

router.get("/transfers/:transferId", authenticate, getTransactionsOnTransfer);

export default router;
