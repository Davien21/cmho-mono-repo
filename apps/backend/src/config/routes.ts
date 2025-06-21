import express from "express";
const router = express.Router();

import authRouter from "../modules/auth/auth.router";
import banksRouter from "../modules/banks/banks.router";
import employeesRouter from "../modules/employees/employees.router";
import dashboardRouter from "../modules/dashboard/dashboard.router";
import transfersRouter from "../modules/transfers/transfers.router";
import transactionsRouter from "../modules/transactions/transactions.router";
import webhooksRouter from "../modules/webhooks/webhooks.router";

router.use(authRouter);
router.use(banksRouter);
router.use(employeesRouter);
router.use(dashboardRouter);
router.use(transfersRouter);
router.use(transactionsRouter);
router.use(webhooksRouter);

export default router;
