import { Transaction } from "./transactions.model";
import { ITransaction, TransactionStatus } from "./transactions.types";
import mongoose from "mongoose";

class TransactionsService {
  /**
   * Store transaction in database
   */
  async create(
    transactionData: Omit<ITransaction, "_id">
  ): Promise<ITransaction> {
    return Transaction.create(transactionData);
  }

  async createMany(
    transactionData: Omit<ITransaction, "_id">[]
  ): Promise<ITransaction[]> {
    return Transaction.insertMany(transactionData);
  }

  async updateTransaction(
    id: string,
    updateData: Partial<Omit<ITransaction, "_id">>
  ): Promise<ITransaction | null> {
    return Transaction.findByIdAndUpdate(id, updateData, { new: true });
  }

  /**
   * Get all transactions with pagination, sorting, and search
   */
  async getTransactions({
    sort = -1,
    limit = 10,
    page = 1,
    search,
    status,
  }: {
    sort?: 1 | -1;
    limit?: number;
    page?: number;
    search?: string;
    status?: string;
  }) {
    const skip = (page - 1) * limit;

    // Build the aggregation pipeline
    const pipeline: any[] = [
      // Populate employee data for search functionality
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employee",
        },
      },
      // Unwind the employee array created by lookup
      {
        $unwind: "$employee",
      },
    ];

    // Add search functionality for employee name and position
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "employee.name": { $regex: search, $options: "i" } },
            { "employee.position": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Add status filter if provided
    if (status) {
      pipeline.push({
        $match: { status },
      });
    }

    // Add sorting
    pipeline.push({
      $sort: { _id: sort },
    });

    // Get total count for pagination
    const totalCountPipeline = [...pipeline, { $count: "total" }];
    const totalCountResult = await Transaction.aggregate(totalCountPipeline);
    const totalCount = totalCountResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limit });

    const transactions = await Transaction.aggregate(pipeline);

    return {
      transactions,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get transactions by transfer ID
   */
  async getTransactionsByTransferId(
    transferId: string
  ): Promise<ITransaction[]> {
    return await Transaction.find({ transfer: transferId }).populate(
      "employee"
    );
  }

  /**
   * Find transaction by Paystack reference
   */
  async findByPaystackReference(
    reference: string
  ): Promise<ITransaction | null> {
    return Transaction.findOne({ paystackTxReference: reference });
  }

  /**
   * Update transaction status from webhook
   */
  async updateTransactionStatus(
    reference: string,
    status: TransactionStatus,
    failureReason?: string
  ): Promise<ITransaction | null> {
    const updateData: any = {
      status,
      "paystackMeta.webhookProcessed": true,
      "paystackMeta.webhookReceivedAt": new Date(),
    };

    if (status === TransactionStatus.SUCCESS) {
      updateData["paystackMeta.completedAt"] = new Date();
    }

    if (failureReason) {
      updateData["paystackMeta.failureReason"] = failureReason;
    }

    return Transaction.findOneAndUpdate(
      { paystackTxReference: reference },
      updateData,
      { new: true }
    );
  }

  /**
   * Get transactions by status
   */
  async getTransactionsByStatus(
    status: TransactionStatus
  ): Promise<ITransaction[]> {
    return Transaction.find({ status }).populate(["employee", "transfer"]);
  }

  /**
   * Get pending transactions (for monitoring/retry purposes)
   */
  async getPendingTransactions(): Promise<ITransaction[]> {
    return Transaction.find({
      status: TransactionStatus.PENDING,
      createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) }, // older than 5 minutes
    }).populate(["employee", "transfer"]);
  }
}

const transactionsService = new TransactionsService();

export default transactionsService;
