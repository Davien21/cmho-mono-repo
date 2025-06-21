import express from "express";
const router = express.Router();

import { authenticate } from "../../middlewares/authentication";
import { getTransactions } from "./transactions.controller";
import validator from "../../middlewares/validator";
import { getTransactionsSchema } from "./transactions.validators";

router.get(
  "/transactions",
  authenticate,
  validator(getTransactionsSchema, "query"),
  getTransactions
);

export default router;
