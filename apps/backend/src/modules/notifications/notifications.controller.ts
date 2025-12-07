import { Request, Response } from "express";
import { successResponse } from "../../utils/response";
import notificationsService from "./notifications.service";
import { NotificationStatus } from "./notifications.types";

export async function getNotifications(req: Request, res: Response) {
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
    module: module as string | undefined,
    type: type as string | undefined,
    inventoryId: inventoryId as string | undefined,
    title: title as string | undefined,
    search: search as string | undefined,
    limit: parseInt(limit as string),
    page: parseInt(page as string),
    sort: sort === "desc" ? -1 : 1,
  });

  res.send(
    successResponse("Notifications fetched successfully", notifications)
  );
}

