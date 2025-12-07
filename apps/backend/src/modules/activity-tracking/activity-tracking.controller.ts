import { Request, Response } from "express";
import { successResponse } from "../../utils/response";
import activityTrackingService from "./activity-tracking.service";

export async function getActivities(req: Request, res: Response) {
  const {
    sort = "desc",
    limit = "10",
    page = "1",
    adminId,
    module,
    entityId,
    type,
    startDate,
    endDate,
    search,
  } = req.query;

  const activities = await activityTrackingService.list({
    adminId: adminId as string | undefined,
    module: module as string | undefined,
    entityId: entityId as string | undefined,
    type: type as string | undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    search: search as string | undefined,
    limit: parseInt(limit as string),
    page: parseInt(page as string),
    sort: sort === "desc" ? -1 : 1,
  });

  res.send(successResponse("Activities fetched successfully", activities));
}

