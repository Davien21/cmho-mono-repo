import { Request } from "express";
import { UnAuthorizedError } from "../config/errors";
import { IAdmin } from "../modules/admins/admins.types";

/**
 * Gets the authenticated admin from the request.
 * Throws UnAuthorizedError (401) if admin is not present.
 */
export function getAdminFromReq(req: Request): Omit<IAdmin, "passwordHash"> {
  if (!req.user) {
    throw new UnAuthorizedError("Authentication required");
  }
  return req.user;
}

