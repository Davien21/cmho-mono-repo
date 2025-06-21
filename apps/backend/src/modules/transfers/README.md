# Transfers Module

This module handles single and bulk transfers using Paystack's Transfer API and stores transaction records in the database.

## Prerequisites

1. **Paystack Account**: You need a Paystack account with transfer capabilities enabled
2. **Environment Variables**: Set your `PAYSTACK_SECRET_KEY` in your environment variables
3. **Account Balance**: Ensure you have sufficient balance in your Paystack account

## Endpoints

### 1. Single Transfer

**POST** `/api/v1/transfers/single`

Initiates a single transfer to a recipient and stores the transaction in the database.

#### Request Body

```json
{
  "amount": 5000,
  "recipient": {
    "name": "John Doe",
    "account_number": "0123456789",
    "bank_code": "044"
  },
  "reason": "Salary payment",
  "reference": "SAL_001_2024"
}
```

#### Response

```json
{
  "success": true,
  "message": "Transfer initiated successfully",
  "data": {
    "transfer": {
      "amount": 500000,
      "reference": "SAL_001_2024",
      "status": "pending",
      "transfer_code": "TRF_xxx"
    },
    "transaction": {
      "_id": "64f...",
      "amount": 5000,
      "reference": "SAL_001_2024",
      "status": "pending",
      "type": "single",
      "recipient": {
        "name": "John Doe",
        "account_number": "0123456789",
        "bank_code": "044"
      }
    }
  }
}
```

### 2. Bulk Transfers

**POST** `/api/v1/transfers/bulk`

Initiates multiple transfers in a single batch and stores all transactions in the database.

#### Request Body

```json
{
  "transfers": [
    {
      "amount": 5000,
      "recipient": {
        "name": "John Doe",
        "account_number": "0123456789",
        "bank_code": "044"
      },
      "reason": "Salary payment"
    },
    {
      "amount": 7500,
      "recipient": {
        "name": "Jane Smith",
        "account_number": "9876543210",
        "bank_code": "058"
      },
      "reason": "Bonus payment"
    }
  ]
}
```

#### Response

```json
{
  "success": true,
  "message": "Bulk transfers initiated successfully",
  "data": {
    "bulkTransfer": {
      "batch_code": "BCH_xxx",
      "status": "pending",
      "total_amount": 1250000
    },
    "transactions": [
      {
        "_id": "64f...",
        "amount": 5000,
        "status": "pending",
        "type": "bulk",
        "batch_code": "BCH_xxx"
      }
    ]
  }
}
```

### 3. Get Transactions (Database)

**GET** `/api/v1/transactions`

Retrieves transactions from the database with filtering, sorting, and pagination.

#### Query Parameters

- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of items per page (default: 50, max: 100)
- `sort` (optional): Sort order - 'asc' or 'desc' (default: 'desc')
- `status` (optional): Filter by status - 'pending', 'success', 'failed', 'reversed'
- `type` (optional): Filter by type - 'single' or 'bulk'
- `startDate` (optional): Filter transactions from this date (ISO format)
- `endDate` (optional): Filter transactions until this date (ISO format)

#### Example Request

```
GET /api/v1/transactions?page=1&limit=20&sort=desc&status=success&type=single&startDate=2024-01-01&endDate=2024-12-31
```

#### Response

```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": {
    "data": [
      {
        "_id": "64f...",
        "amount": 5000,
        "amount_in_kobo": 500000,
        "reference": "SAL_001_2024",
        "status": "success",
        "type": "single",
        "recipient": {
          "name": "John Doe",
          "account_number": "0123456789",
          "bank_code": "044",
          "bank_name": "Access Bank"
        },
        "transfer_code": "TRF_xxx",
        "initiated_at": "2024-01-15T10:30:00Z",
        "completed_at": "2024-01-15T10:35:00Z"
      }
    ],
    "meta": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 4. Get Transaction by Reference (Database)

**GET** `/api/v1/transactions/:reference`

Retrieves a specific transaction from the database by reference.

#### Response

```json
{
  "success": true,
  "message": "Transaction details retrieved successfully",
  "data": {
    "_id": "64f...",
    "amount": 5000,
    "reference": "SAL_001_2024",
    "status": "success",
    "type": "single",
    "recipient": {
      "name": "John Doe",
      "account_number": "0123456789",
      "bank_code": "044"
    },
    "transfer_code": "TRF_xxx",
    "paystack_response": {
      /* Full Paystack response */
    }
  }
}
```

### 5. Get Transaction Statistics

**GET** `/api/v1/transactions/stats`

Retrieves transaction statistics from the database.

#### Response

```json
{
  "success": true,
  "message": "Transaction statistics retrieved successfully",
  "data": {
    "totalTransactions": 1250,
    "totalAmount": 15750000,
    "successfulTransactions": 1200,
    "failedTransactions": 30,
    "pendingTransactions": 20,
    "totalAmountByStatus": {
      "success": 15000000,
      "failed": 500000,
      "pending": 250000
    }
  }
}
```

### 6. Get Transfer Details (Paystack)

**GET** `/api/v1/transfers/paystack/:reference`

Retrieves details of a specific transfer from Paystack by reference.

#### Response

```json
{
  "success": true,
  "message": "Transfer details retrieved successfully",
  "data": {
    "amount": 500000,
    "reference": "SAL_001_2024",
    "status": "success",
    "transfer_code": "TRF_xxx"
  }
}
```

### 7. List Transfers (Paystack)

**GET** `/api/v1/transfers/paystack?page=1&perPage=50`

Lists all transfers from Paystack with pagination.

#### Query Parameters

- `page` (optional): Page number (default: 1)
- `perPage` (optional): Number of items per page (default: 50, max: 100)

#### Response

```json
{
  "success": true,
  "message": "Transfers retrieved successfully",
  "data": {
    "data": [
      {
        "amount": 500000,
        "reference": "SAL_001_2024",
        "status": "success"
      }
    ],
    "meta": {
      "total": 100,
      "page": 1,
      "perPage": 50,
      "pageCount": 2
    }
  }
}
```

### 8. Get Account Balance

**GET** `/api/v1/transfers/account/balance`

Retrieves the current account balance from Paystack.

#### Response

```json
{
  "success": true,
  "message": "Account balance retrieved successfully",
  "data": [
    {
      "currency": "NGN",
      "balance": 1000000
    }
  ]
}
```

## Database Storage

All transfers are automatically stored in the database with the following information:

- **Transaction Details**: Amount, recipient info, reference, reason
- **Paystack Data**: Transfer codes, recipient codes, full API responses
- **Status Tracking**: Real-time status updates (pending → success/failed)
- **Audit Trail**: Who initiated the transfer and when
- **Batch Information**: For bulk transfers, all transactions share a batch code

## Validation Rules

### Transfer Amount

- Minimum: ₦100
- Maximum: ₦10,000,000

### Account Number

- Must be exactly 10 digits
- Only numeric characters allowed

### Bank Code

- Must be exactly 3 digits
- Use `/api/v1/banks/list` to get valid bank codes

### Bulk Transfers

- Maximum 100 transfers per batch
- Each transfer follows the same validation rules as single transfers

### Query Parameters

- `page`: Must be a positive integer
- `limit`: Must be between 1 and 100
- `sort`: Must be either 'asc' or 'desc'
- `status`: Must be one of 'pending', 'success', 'failed', 'reversed'
- `type`: Must be either 'single' or 'bulk'
- `startDate`/`endDate`: Must be valid ISO date strings

## Error Handling

Common error responses:

```json
{
  "success": false,
  "message": "Insufficient balance to complete transfer"
}
```

```json
{
  "success": false,
  "message": "Transfer 1: Account number must be exactly 10 digits"
}
```

```json
{
  "success": false,
  "message": "Invalid status filter"
}
```

## Authentication

All endpoints require authentication. Include the authentication token in your request headers or cookies as configured in your authentication middleware.

## Notes

1. **Amounts**: All amounts are in Naira (₦). The system automatically converts to kobo for Paystack API calls.
2. **References**: If not provided, a unique reference will be automatically generated.
3. **Status**: Transfers may have statuses like `pending`, `success`, `failed`, etc.
4. **Database vs Paystack**: Use `/transactions` endpoints for database queries (faster, more filtering options) and `/transfers/paystack` for real-time Paystack data.
5. **Testing**: Use Paystack's test keys for development and testing.
6. **Performance**: Database queries are indexed for optimal performance on common search patterns.
