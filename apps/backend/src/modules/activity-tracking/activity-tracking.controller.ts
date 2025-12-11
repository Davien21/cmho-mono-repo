import { Request, Response } from "express";
import { successResponse } from "../../utils/response";
import activityTrackingService from "./activity-tracking.service";
import { GetActivitiesQuerySchema } from "./activity-tracking.validator";

export async function getActivities(
  req: Request<{}, {}, {}, GetActivitiesQuerySchema>,
  res: Response
) {
  const { sort = "desc", limit = "10", page = "1", module, search } = req.query;

  const activities = await activityTrackingService.list({
    module: module,
    search: search,
    limit: parseInt(limit),
    page: parseInt(page),
    sort: sort === "desc" ? -1 : 1,
  });

  res.send(successResponse("Activities fetched successfully", activities));
}
