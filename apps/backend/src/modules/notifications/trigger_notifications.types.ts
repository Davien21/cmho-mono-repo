export enum NotificationType {
  OUT_OF_STOCK = "out_of_stock",
  LOW_STOCK = "low_stock",
}

export enum NotificationModule {
  INVENTORY = "inventory",
  SALARY = "salary",
  ADMIN = "admin",
}

export enum NotificationStatus {
  ACTIVE = "active",
  RESOLVED = "resolved",
}

export enum NotificationPriority {
  HIGH = "HIGH",
  MED = "MED",
  LOW = "LOW",
}

// Metadata types for known notification types
export interface InventoryNotificationMetadata {
  inventoryId: string; // MongoDB ObjectId of inventory item
  currentStock: number;
  lowStockValue: number;
  [key: string]: any; // Allow additional fields for flexibility
}

// Union type for all known metadata types
export type NotificationMetadata = InventoryNotificationMetadata;

// Base notification interface with typed metadata
export interface ITriggerNotification<
  T extends NotificationMetadata = NotificationMetadata
> {
  _id: string;
  type: NotificationType;
  module: NotificationModule;
  status: NotificationStatus;
  title: string;
  description: string;
  priority: NotificationPriority;
  metadata: T;
  createdAt: Date;
  updatedAt: Date;
}

// Request interface for creating/updating notifications
export interface NotificationRequest<
  T extends NotificationMetadata = NotificationMetadata
> {
  type: NotificationType;
  module: NotificationModule;
  title: string;
  description: string;
  priority: NotificationPriority;
  metadata: T;
}
