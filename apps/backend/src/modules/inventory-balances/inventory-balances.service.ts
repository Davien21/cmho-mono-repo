import AIInventoryBalanceItem from "./inventory-balances.model";
import {
  IAIInventoryBalanceItem,
  AIInventoryBalanceStatus,
  CreateAIInventoryBalanceRequest,
} from "./inventory-balances.types";
import mongoose from "mongoose";

class InventoryBalancesService {
  async list({
    status = AIInventoryBalanceStatus.PENDING,
  }: {
    status?: AIInventoryBalanceStatus;
  } = {}) {
    const filter: any = { isDeleted: { $ne: true }, status };

    const items = await AIInventoryBalanceItem.find(filter)
      .sort({ _id: 1 })
      .lean();

    return {
      items,
    };
  }

  async createMany(data: CreateAIInventoryBalanceRequest) {
    const docs = data.items.map((item) => ({
      media: {
        id: new mongoose.Types.ObjectId(data.media_id),
        url: data.imageUrl,
      },
      name: item.name,
      quantity_details: item.quantity_details,
      status: AIInventoryBalanceStatus.PENDING,
    }));

    const result = await AIInventoryBalanceItem.insertMany(docs);
    // Convert to plain objects for response
    return result.map(doc => doc.toObject());
  }

  async update(id: string, data: Partial<IAIInventoryBalanceItem>) {
    return AIInventoryBalanceItem.findByIdAndUpdate(id, data, {
      new: true,
    }).lean();
  }

  async deleteByMediaId(mediaId: string) {
    return AIInventoryBalanceItem.updateMany(
      { "media.id": new mongoose.Types.ObjectId(mediaId) },
      { isDeleted: true, deletedAt: new Date() }
    );
  }

  async delete(id: string) {
    return AIInventoryBalanceItem.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).lean();
  }

  async getByMediaId(mediaId: string) {
    const items = await AIInventoryBalanceItem.find({
      "media.id": new mongoose.Types.ObjectId(mediaId),
      isDeleted: { $ne: true },
      status: AIInventoryBalanceStatus.PENDING,
    })
      .sort({ _id: 1 })
      .lean();

    return {
      items,
    };
  }
}

export default new InventoryBalancesService();
