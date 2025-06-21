import express from "express";
const router = express.Router();

import authController from "./auth.controller";
import { authenticate } from "../../middlewares/authentication";
router.post("/auth/login", authController.login);

router.post("/auth/logout", authController.logout);

router.get("/auth/verify", authenticate, authController.verifyAccess);

export default router;
