import express from "express";
import {
  handlePaystackWebhook,
  testWebhookEndpoint,
} from "./webhooks.controller";

const router = express.Router();

/**
 * @route POST /webhooks/paystack
 * @desc Handle Paystack webhook events
 * @access Public (Paystack calls this endpoint)
 */
router.post("/webhooks/paystack", handlePaystackWebhook);

/**
 * @route GET /webhooks/paystack/test
 * @desc Test webhook endpoint
 * @access Public
 */
router.get("/webhooks/paystack/test", testWebhookEndpoint);

export default router;
