import express from "express";
const router = express.Router();

import { getNigerianBanks, verifyAccount } from "./banks.controller";
import { authenticate } from "../../middlewares/authentication";

router.get("/banks/list", authenticate, getNigerianBanks);
router.post("/banks/verify", authenticate, verifyAccount);

export default router;
