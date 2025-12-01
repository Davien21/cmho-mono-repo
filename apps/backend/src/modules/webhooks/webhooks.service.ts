import crypto from 'crypto';
import { Request } from 'express';
import { env } from '../../config/env';
import logger from '../../config/logger';
import { PaystackWebhookEvent, PaystackTransferEvents } from './webhooks.types';
import transactionsService from '../transactions/transactions.service';
import { TransactionStatus } from '../transactions/transactions.types';
import { BadRequestError, DuplicateError, NotFoundError } from '../../config/errors';

class WebhooksService {
  /**
   * Validate Paystack webhook signature
   */
  validateWebhookSignature(req: Request) {
    const rawBody = req.body as Buffer;

    const hash = crypto.createHmac('sha512', env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');

    const signature = req.headers['x-paystack-signature'] as string;

    if (!signature) throw new BadRequestError('Missing webhook signature');

    if (hash !== signature) throw new BadRequestError('Invalid webhook signature');
  }

  /**
   * Parse webhook event from raw body
   */
  parseWebhookEvent(req: Request): PaystackWebhookEvent {
    try {
      const rawBody = req.body as Buffer;
      return JSON.parse(rawBody.toString()) as PaystackWebhookEvent;
    } catch (error) {
      logger.error(`Failed to parse webhook event: ${error}`);
      throw new Error('Invalid webhook payload');
    }
  }

  /**
   * Process transfer webhook events
   */
  async processTransferEvent(event: PaystackWebhookEvent): Promise<void> {
    const { event: eventType, data } = event;
    const { reference, reason } = data;

    const transaction = await transactionsService.findByPaystackReference(reference);

    if (!transaction) throw new NotFoundError('Transaction not found');

    const hasProcessed = transaction.paystackMeta.webhookProcessed;
    if (hasProcessed) throw new DuplicateError('Transaction is processed');

    let transactionStatus: TransactionStatus;
    let failureReason: string | undefined;

    // Map Paystack event to transaction status
    switch (eventType) {
      case PaystackTransferEvents.TRANSFER_SUCCESS:
        transactionStatus = TransactionStatus.SUCCESS;
        break;

      case PaystackTransferEvents.TRANSFER_FAILED:
        transactionStatus = TransactionStatus.FAILED;
        failureReason = reason || data.message || 'Transfer failed';
        break;

      case PaystackTransferEvents.TRANSFER_REVERSED:
        transactionStatus = TransactionStatus.REVERSED;
        failureReason = reason || data.message || 'Transfer reversed';
        break;

      default:
        logger.info(`Unhandled transfer event type: ${eventType}`);
        return;
    }

    // Update transaction status

    await transactionsService.updateTransactionStatus(reference, transactionStatus, failureReason);
  }

  /**
   * Main webhook processor
   */
  async processWebhook(event: PaystackWebhookEvent): Promise<void> {
    const { event: eventType } = event;

    // Check if it's a transfer-related event
    const isTransferEvent = Object.values(PaystackTransferEvents).includes(
      eventType as PaystackTransferEvents
    );

    if (isTransferEvent) return await this.processTransferEvent(event);

    logger.info(`Received non-transfer webhook event: ${eventType}`);
  }
}

const webhooksService = new WebhooksService();
export default webhooksService;
