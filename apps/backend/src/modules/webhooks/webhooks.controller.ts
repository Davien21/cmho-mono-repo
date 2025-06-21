import { Request, Response } from "express";
import { successResponse } from "../../utils/response";
import { BadRequestError } from "../../config/errors";
import logger from "../../config/logger";
import webhooksService from "./webhooks.service";

/**
 * Handle Paystack webhook events
 */
export async function handlePaystackWebhook(req: Request, res: Response) {
  // Validate webhook signature
  webhooksService.validateWebhookSignature(req);

  // Parse the webhook event from raw body
  const event = webhooksService.parseWebhookEvent(req);
  // Process the webhook event
  await webhooksService.processWebhook(event);

  // Return success response
  res.send(successResponse("Webhook processed successfully"));
}

/**
 * Test webhook endpoint (for development/testing)
 */
export async function testWebhookEndpoint(req: Request, res: Response) {
  try {
    res.json(
      successResponse("Webhook endpoint is working", {
        timestamp: new Date().toISOString(),
        endpoint: "/webhooks/paystack",
      })
    );
  } catch (error) {
    logger.error(`Webhook test failed: ${error}`);
    throw new BadRequestError("Webhook test failed");
  }
}
