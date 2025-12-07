import mongoose from "mongoose";
import ActivityRecord from "./activity-tracking.model";
import { IActivityRecord } from "./activity-tracking.types";

class ActivityTrackingService {
  /**
   * Track a single activity
   */
  async trackActivity(activityData: {
    type: string;
    module: string;
    entities: Array<{
      id: string;
      name: string; // Model/collection name
    }>;
    adminId: string | mongoose.Types.ObjectId;
    adminName: string;
    description: string;
    metadata?: {
      [key: string]: any;
    };
  }): Promise<IActivityRecord> {
    // Convert adminId string to ObjectId if needed
    const adminIdObjectId =
      typeof activityData.adminId === "string"
        ? new mongoose.Types.ObjectId(activityData.adminId)
        : activityData.adminId;

    const record = await ActivityRecord.create({
      type: activityData.type,
      module: activityData.module,
      entities: activityData.entities,
      admin: {
        id: adminIdObjectId,
        name: activityData.adminName,
      },
      description: activityData.description,
      metadata: activityData.metadata || {},
    });

    return record;
  }

  /**
   * Query activities with filters
   */
  async list(filters: {
    adminId?: string;
    module?: string;
    entityId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string; // Regex search for description OR admin name
    limit?: number;
    page?: number;
    sort?: 1 | -1;
  }): Promise<{
    data: IActivityRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      adminId,
      module,
      entityId,
      type,
      startDate,
      endDate,
      search,
      limit = 10,
      page = 1,
      sort = -1,
    } = filters;

    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (adminId) filter["admin.id"] = adminId;
    if (module) filter.module = module;
    if (entityId) filter["entities.id"] = entityId;
    if (type) filter.type = type;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    // Add regex search for description OR admin name
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { "admin.name": { $regex: search, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      ActivityRecord.find(filter)
        .sort({ createdAt: sort })
        .limit(limit)
        .skip(skip)
        .lean(),
      ActivityRecord.countDocuments(filter),
    ]);

    return {
      data: data as IActivityRecord[],
      total,
      page,
      limit,
    };
  }

  /**
   * Get activities for a specific entity
   */
  async getByEntityId(
    entityId: string,
    limit = 10
  ): Promise<IActivityRecord[]> {
    return ActivityRecord.find({ "entities.id": entityId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean() as Promise<IActivityRecord[]>;
  }

  /**
   * Get activities for a specific admin
   */
  async getByAdminId(adminId: string, limit = 10): Promise<IActivityRecord[]> {
    return ActivityRecord.find({ "admin.id": adminId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean() as Promise<IActivityRecord[]>;
  }
}

const activityTrackingService = new ActivityTrackingService();

export default activityTrackingService;
