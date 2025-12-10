import { Request, Response } from "express";
import { successResponse } from "../../utils/response";
import notificationsService from "./trigger_notifications.service";
import { GetNotificationsQuerySchema } from "./trigger_notifications.validators";
import { NotificationStatus } from "./trigger_notifications.types";

export async function getNotifications(
  req: Request<{}, {}, {}, GetNotificationsQuerySchema>,
  res: Response
) {
  const {
    sort = "desc",
    limit = "10",
    page = "1",
    status,
    module,
    type,
    inventoryId,
    title,
    search,
  } = req.query;

  const notifications = await notificationsService.list({
    status: status as NotificationStatus | undefined,
    module: module,
    type: type,
    inventoryId: inventoryId,
    title: title,
    search: search,
    limit: parseInt(limit),
    page: parseInt(page),
    sort: sort === "desc" ? -1 : 1,
  });

  res.send(
    successResponse("Notifications fetched successfully", notifications)
  );
}
