# Webhooks Module

This module handles Paystack webhook events for transfer status updates. It automatically updates transaction statuses when transfers are completed, failed, or reversed.

## Features

- **Webhook Signature Validation**: Validates incoming webhooks using Paystack's signature verification
- **Transfer Event Processing**: Handles `transfer.success`, `transfer.failed`, and `transfer.reversed` events
- **Automatic Status Updates**: Updates transaction status in the database based on webhook events
- **Bulk Transfer Support**: Handles both single and bulk transfer webhook events
- **Idempotency**: Prevents duplicate processing of the same webhook event
- **Statistics**: Provides webhook processing statistics

## Setup

### 1. Paystack Dashboard Configuration

1. Log in to your [Paystack Dashboard](https://dashboard.paystack.com)
2. Navigate to **Settings** → **Webhooks**
3. Click **Add Endpoint**
4. Set the webhook URL to: `https://your-domain.com/api/v1/webhooks/paystack`
5. Select the following events:
   - `transfer.success`
   - `transfer.failed`
   - `transfer.reversed`
6. Save the webhook configuration

### 2. Environment Variables

Ensure your `PAYSTACK_SECRET_KEY` is properly configured in your environment variables. This is used for webhook signature validation.

```env
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
```

### 3. Express Middleware Configuration

**Important**: The webhook endpoint requires raw body access for signature validation. The application is configured with:

```typescript
// Raw body middleware for webhook endpoints (must come before express.json)
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));
```

This ensures that webhook requests preserve the raw body buffer needed for HMAC signature verification, while other endpoints continue to use parsed JSON.

### 4. Testing

You can test the webhook endpoint using:

```bash
# Test if the webhook endpoint is accessible
curl -X GET https://your-domain.com/api/v1/webhooks/paystack/test

# Test webhook processing (requires valid Paystack signature)
curl -X POST https://your-domain.com/api/v1/webhooks/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: your_signature_here" \
  -d '{"event": "transfer.success", "data": {...}}'
```

## API Endpoints

### 1. Handle Paystack Webhook

**POST** `/api/v1/webhooks/paystack`

Handles incoming Paystack webhook events.

**Headers:**

- `x-paystack-signature`: Paystack webhook signature (required)
- `Content-Type`: application/json

**Request Body:**

```json
{
  "event": "transfer.success",
  "data": {
    "id": 12345,
    "reference": "TRF_abc123def456",
    "status": "success",
    "amount": 50000,
    "message": "Transfer successful",
    "recipient": {
      "recipient_code": "RCP_xyz789",
      "name": "John Doe"
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "event": "transfer.success",
    "processed": true
  }
}
```

### 2. Test Webhook Endpoint

**GET** `/api/v1/webhooks/paystack/test`

Tests if the webhook endpoint is accessible.

**Response:**

```json
{
  "success": true,
  "message": "Webhook endpoint is working",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "endpoint": "/webhooks/paystack"
  }
}
```

### 3. Get Webhook Statistics

**GET** `/api/v1/webhooks/stats`

Retrieves webhook processing statistics (requires authentication).

**Headers:**

- `Authorization`: Bearer token (required)

**Response:**

```json
{
  "success": true,
  "message": "Webhook statistics retrieved successfully",
  "data": {
    "processedCount": 150,
    "failedCount": 5,
    "reversedCount": 2,
    "pendingCount": 3
  }
}
```

## Webhook Events

### Supported Events

1. **transfer.success**: Transfer completed successfully
2. **transfer.failed**: Transfer failed
3. **transfer.reversed**: Transfer was reversed

### Event Processing

When a webhook is received:

1. **Signature Validation**: Verifies the webhook signature using your Paystack secret key
2. **Transaction Lookup**: Finds the transaction using the Paystack reference
3. **Status Update**: Updates the transaction status based on the event type
4. **Idempotency Check**: Skips processing if the webhook was already processed
5. **Logging**: Logs the processing result

### Transaction Status Mapping

| Paystack Event      | Transaction Status |
| ------------------- | ------------------ |
| `transfer.success`  | `success`          |
| `transfer.failed`   | `failed`           |
| `transfer.reversed` | `reversed`         |

## Database Schema Updates

The webhook module adds the following fields to the Transaction model:

```typescript
{
  status: TransactionStatus; // 'pending' | 'success' | 'failed' | 'reversed'
  paystackMeta: {
    webhookProcessed: boolean; // Whether webhook was processed
    webhookReceivedAt?: Date; // When webhook was received
    completedAt?: Date; // When transaction was completed
    failureReason?: string; // Reason for failure (if applicable)
  }
}
```

## Error Handling

### Webhook Validation Errors

- **Invalid Signature**: Returns 400 Bad Request
- **Missing Signature**: Returns 400 Bad Request
- **Malformed Payload**: Returns 400 Bad Request

### Processing Errors

- **Transaction Not Found**: Logs warning and continues
- **Already Processed**: Logs info and skips processing
- **Database Errors**: Logs error and returns 500 Internal Server Error

## Security

### Signature Verification

All incoming webhooks are verified using HMAC SHA512 signature verification:

```typescript
const hash = crypto
  .createHmac('sha512', PAYSTACK_SECRET_KEY)
  .update(JSON.stringify(requestBody))
  .digest('hex');
```

### Best Practices

1. **Keep Secret Key Secure**: Never expose your Paystack secret key
2. **Use HTTPS**: Always use HTTPS for webhook endpoints
3. **Validate Signatures**: Always validate webhook signatures
4. **Handle Idempotency**: Check if webhooks were already processed
5. **Log Events**: Log all webhook events for debugging and monitoring

## Monitoring

### Logs

The webhook module logs the following events:

- Webhook received and event type
- Signature validation results
- Transaction updates
- Processing errors
- Duplicate webhook attempts

### Statistics

Use the `/webhooks/stats` endpoint to monitor:

- Number of successfully processed webhooks
- Number of failed transactions
- Number of reversed transactions
- Number of pending transactions

## Troubleshooting

### Common Issues

1. **Webhook Not Triggered**
   - Check Paystack dashboard webhook configuration
   - Verify webhook URL is accessible
   - Check if events are properly selected

2. **Signature Validation Failed**
   - Verify `PAYSTACK_SECRET_KEY` is correct
   - Ensure the raw body middleware is configured: `app.use("/api/v1/webhooks", express.raw({ type: "application/json" }))`
   - Check if request body is being modified by other middleware
   - Ensure Content-Type is application/json
   - Verify the raw body middleware comes before `express.json()` middleware

3. **Transaction Not Found**
   - Verify transaction was created with correct Paystack reference
   - Check if reference format matches Paystack's format

4. **Duplicate Processing**
   - Check `paystackMeta.webhookProcessed` field in transaction
   - Review logs for duplicate webhook attempts

### Debug Mode

Enable debug logging by checking the application logs for webhook-related entries:

```bash
# View webhook logs
tail -f all-logs.log | grep -i webhook

# View error logs
tail -f errors.log | grep -i webhook
```

## Development

### Local Testing

For local development, you can use tools like ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the ngrok URL in Paystack webhook configuration
# https://abc123.ngrok.io/api/v1/webhooks/paystack
```

### Testing with Paystack

1. Use Paystack test keys for development
2. Create test transfers to trigger webhooks
3. Monitor logs to verify webhook processing
4. Use the test endpoint to verify connectivity

## Production Deployment

### Checklist

- [ ] Webhook URL is accessible via HTTPS
- [ ] Paystack secret key is properly configured
- [ ] Webhook events are selected in Paystack dashboard
- [ ] Error monitoring is set up
- [ ] Logs are being collected and monitored
- [ ] Database backups are configured

### Monitoring

Set up monitoring for:

- Webhook endpoint availability
- Processing success rates
- Error rates and types
- Response times
- Database performance
