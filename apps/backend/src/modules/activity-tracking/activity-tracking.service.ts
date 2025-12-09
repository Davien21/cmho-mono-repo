import mongoose from "mongoose";
import ActivityRecord from "./activity-tracking.model";
import { ActivityType } from "./activity-tracking.types";
import { IActivityRecord } from "./activity-tracking.types";

class ActivityTrackingService {
  /**
   * Track a single activity
   */

  private toObjectId(
    id: string | mongoose.Types.ObjectId
  ): mongoose.Types.ObjectId {
    return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
  }

  async trackActivity(activityData: {
    type: ActivityType;
    module: string;
    entities: Array<{
      id: string | mongoose.Types.ObjectId;
      name: string; // Model/collection name
    }>;
    performerId: string | mongoose.Types.ObjectId;
    performerName: string;
    description: string;
    metadata?: {
      [key: string]: any;
    };
  }): Promise<IActivityRecord> {
    // Convert entity ids to strings
    const entities = activityData.entities.map((entity) => ({
      id: entity.id.toString(),
      name: entity.name,
    }));

    const record = await ActivityRecord.create({
      type: activityData.type,
      module: activityData.module,
      entities,
      performer: {
        id: this.toObjectId(activityData.performerId),
        name: activityData.performerName,
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
    module?: string;
    search?: string; // Regex search for description OR performer name
    limit?: number;
    page?: number;
    sort?: 1 | -1;
  }): Promise<{
    data: IActivityRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { module, search, limit = 10, page = 1, sort = -1 } = filters;

    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (module) filter.module = module;

    // Add regex search for description OR performer name
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { "performer.name": { $regex: search, $options: "i" } },
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
}

const activityTrackingService = new ActivityTrackingService();

export default activityTrackingService;
