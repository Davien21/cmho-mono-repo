import express from "express";
import { getAccountBalance, getDashboardStats } from "./dashboard.controller";
import { authenticate } from "../../middlewares/authentication";

const router = express.Router();

router.get("/dashboard", authenticate, getDashboardStats);
router.get("/dashboard/account-balance", authenticate, getAccountBalance);

export default router;
