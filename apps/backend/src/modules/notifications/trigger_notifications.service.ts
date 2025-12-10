import TriggerNotification from "./trigger_notifications.model";
import {
  ITriggerNotification,
  NotificationRequest,
  NotificationStatus,
  NotificationType,
  NotificationModule,
  NotificationPriority,
  NotificationMetadata,
  InventoryNotificationMetadata,
} from "./trigger_notifications.types";

class NotificationsService {
  /**
   * Build entity query from notification metadata based on module
   */
  private buildEntityQuery(
    module: NotificationModule,
    metadata: NotificationMetadata
  ): Record<string, any> {
    if (module === NotificationModule.INVENTORY) {
      const inventoryMeta = metadata as InventoryNotificationMetadata;
      if (inventoryMeta.inventoryId) {
        return { "metadata.inventoryId": inventoryMeta.inventoryId };
      }
    }
    // Add more module-specific queries here as new modules are added
    return {};
  }

  /**
   * Create or update an active notification for a specific entity and type
   * If an active notification already exists, it will be updated
   */
  async createOrUpdateNotification<T extends NotificationRequest>(
    data: T
  ): Promise<ITriggerNotification | null> {
    const entityQuery = this.buildEntityQuery(data.module, data.metadata);

    // Check if an active notification already exists for this entity and type
    const existing = await TriggerNotification.findOne({
      ...entityQuery,
      type: data.type,
      status: NotificationStatus.ACTIVE,
    });

    if (existing) {
      // Update existing notification
      existing.title = data.title;
      existing.description = data.description;
      existing.priority = data.priority;
      existing.metadata = data.metadata;
      await existing.save();
      return existing;
    }

    // Create new notification
    const notification = await TriggerNotification.create(data);
    return notification;
  }

  /**
   * Check and create inventory stock notifications
   */
  async checkInventoryStockNotifications(
    itemId: string,
    itemName: string,
    currentStock: number,
    lowStockValue?: number
  ): Promise<void> {
    // Only check for "ready" items with lowStockValue set
    if (!lowStockValue) {
      // If no lowStockValue, resolve any existing notifications
      await this.resolveNotificationByInventoryId(
        itemId,
        NotificationType.OUT_OF_STOCK
      );
      await this.resolveNotificationByInventoryId(
        itemId,
        NotificationType.LOW_STOCK
      );
      return;
    }

    // Check for out of stock (currentStock === 0)
    if (currentStock === 0) {
      await this.createOrUpdateNotification({
        type: NotificationType.OUT_OF_STOCK,
        module: NotificationModule.INVENTORY,
        title: "OUT OF STOCK",
        description: `${itemName} is finished and needs immediate restocking.`,
        priority: NotificationPriority.HIGH,
        metadata: {
          inventoryId: itemId,
          currentStock,
          lowStockValue,
        },
      });
      // Resolve low_stock if it exists (since we're now out of stock)
      await this.resolveNotificationByInventoryId(
        itemId,
        NotificationType.LOW_STOCK
      );
    } else if (currentStock > 0 && currentStock <= lowStockValue) {
      // Check for low stock
      await this.createOrUpdateNotification({
        type: NotificationType.LOW_STOCK,
        module: NotificationModule.INVENTORY,
        title: "LOW STOCK",
        description: `${itemName} only has (${currentStock} units out of minimum ${lowStockValue} units).`,
        priority: NotificationPriority.MED,
        metadata: {
          inventoryId: itemId,
          currentStock,
          lowStockValue,
        },
      });
      // Resolve out_of_stock if it exists (since we now have stock)
      await this.resolveNotificationByInventoryId(
        itemId,
        NotificationType.OUT_OF_STOCK
      );
    } else {
      // Stock is above threshold, resolve any existing notifications
      await this.resolveNotificationByInventoryId(
        itemId,
        NotificationType.OUT_OF_STOCK
      );
      await this.resolveNotificationByInventoryId(
        itemId,
        NotificationType.LOW_STOCK
      );
    }
  }

  /**
   * Resolve a notification by inventory ID and type (for inventory module)
   */
  async resolveNotificationByInventoryId(
    inventoryId: string,
    type: NotificationType
  ): Promise<ITriggerNotification | null> {
    const notification = await TriggerNotification.findOne({
      "metadata.inventoryId": inventoryId,
      type,
      status: NotificationStatus.ACTIVE,
    });

    if (notification) {
      notification.status = NotificationStatus.RESOLVED;
      await notification.save();
      return notification;
    }

    return null;
  }

  /**
   * List notifications with filters and pagination
   */
  async list(filters: {
    status?: NotificationStatus;
    module?: string;
    type?: string;
    inventoryId?: string; // For inventory module
    title?: string; // Exact match filter for title
    search?: string; // Regex search for description
    limit?: number;
    page?: number;
    sort?: 1 | -1;
  }): Promise<{
    data: ITriggerNotification[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      status,
      module,
      type,
      inventoryId,
      title,
      search,
      limit = 10,
      page = 1,
      sort = -1,
    } = filters;

    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (module) filter.module = module;
    if (type) filter.type = type;
    if (inventoryId) filter["metadata.inventoryId"] = inventoryId;
    if (title) filter.title = title;
    if (search) filter.description = { $regex: search, $options: "i" };

    const [data, total] = await Promise.all([
      TriggerNotification.find(filter)
        .sort({ updatedAt: sort })
        .limit(limit)
        .skip(skip)
        .lean(),
      TriggerNotification.countDocuments(filter),
    ]);

    return {
      data: data as ITriggerNotification[],
      total,
      page,
      limit,
    };
  }

  /**
   * Get active notifications for a specific inventory item
   */
  async getActiveByInventoryId(
    inventoryId: string
  ): Promise<ITriggerNotification[]> {
    return TriggerNotification.find({
      "metadata.inventoryId": inventoryId,
      status: NotificationStatus.ACTIVE,
    })
      .sort({ updatedAt: -1 })
      .lean() as Promise<ITriggerNotification[]>;
  }
}

const notificationsService = new NotificationsService();

export default notificationsService;
