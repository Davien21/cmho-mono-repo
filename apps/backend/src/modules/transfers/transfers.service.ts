import { Transfer } from "./transfers.model";
import { ITransfer, TransferStatus } from "./transfers.types";
import { ESortOrder } from "../../lib/interfaces";
import mongoose from "mongoose";

type ObjectId = mongoose.Types.ObjectId;

class TransfersService {
  async findById(id: string | ObjectId): Promise<ITransfer | null> {
    return Transfer.findById(id).lean();
  }
  /**
   * Store transfer in database
   */
  async create(transferData: Omit<ITransfer, "_id">): Promise<ITransfer> {
    return Transfer.create(transferData);
  }

  async update(
    id: string | ObjectId,
    updateData: Partial<Omit<ITransfer, "_id">>
  ): Promise<ITransfer | null> {
    return Transfer.findByIdAndUpdate(id, updateData, { new: true });
  }

  /**
   * Get transfers from database with filtering, sorting, and pagination
   */
  async getTransfers({
    page = 1,
    limit = 50,
    sort = ESortOrder.DESC,
    status,
  }: {
    page?: number;
    limit?: number;
    sort?: ESortOrder;
    status?: TransferStatus;
  } = {}): Promise<{
    transfers: ITransfer[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const skip = (page - 1) * limit;
    const sortOrder = sort === ESortOrder.DESC ? -1 : 1;

    // Build filter query
    const filter: any = {};
    if (status) filter.status = status;

    // Get total count for pagination
    const total = await Transfer.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get transfers
    const transfers = await Transfer.find(filter)
      .sort({ _id: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      transfers,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get transfer statistics
   */
  async getTransferStats(): Promise<{
    totalTransfers: number;
    totalAmountInKobo: number;
    successfulTransfers: number;
    failedTransfers: number;
    pendingTransfers: number;
  }> {
    const stats = await Transfer.aggregate([
      {
        $group: {
          _id: null,
          totalTransfers: { $sum: 1 },
          totalAmountInKobo: { $sum: "$amountInKobo" },
          successfulTransfers: {
            $sum: {
              $cond: [{ $eq: ["$status", TransferStatus.SUCCESS] }, 1, 0],
            },
          },
          failedTransfers: {
            $sum: {
              $cond: [{ $eq: ["$status", TransferStatus.FAILED] }, 1, 0],
            },
          },
          pendingTransfers: {
            $sum: {
              $cond: [{ $eq: ["$status", TransferStatus.PENDING] }, 1, 0],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalTransfers: 0,
      totalAmountInKobo: 0,
      successfulTransfers: 0,
      failedTransfers: 0,
      pendingTransfers: 0,
    };

    return result;
  }
}

export default new TransfersService();
