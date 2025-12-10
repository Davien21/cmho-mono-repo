import * as yup from "yup";
import { paginationQuerySchema } from "../../validators/general.validator";
import {
  NotificationStatus,
  NotificationModule,
  NotificationType,
} from "./trigger_notifications.types";

export const getNotificationsQuerySchema = paginationQuerySchema.shape({
  status: yup
    .string()
    .optional()
    .oneOf(Object.values(NotificationStatus), "Invalid status")
    .label("Status"),
  module: yup
    .string()
    .optional()
    .oneOf(Object.values(NotificationModule), "Invalid module")
    .label("Module"),
  type: yup
    .string()
    .optional()
    .oneOf(Object.values(NotificationType), "Invalid type")
    .label("Type"),
  inventoryId: yup.string().optional().label("Inventory ID"),
  title: yup.string().optional().label("Title"),
  search: yup.string().optional().label("Search"),
});

export type GetNotificationsQuerySchema = yup.InferType<
  typeof getNotificationsQuerySchema
>;
