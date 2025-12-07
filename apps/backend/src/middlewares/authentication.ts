import { NextFunction, Request, Response } from "express";

import { UnAuthorizedError } from "../config/errors";
import authService from "../modules/auth/auth.service";
import { AdminRole, IAdmin } from "../modules/admins/admins.types";
import { JWT_COOKIE_NAME } from "../utils/cookie-names";
import Admin from "../modules/admins/admins.model";

declare global {
  namespace Express {
    interface Request {
      user?: Omit<IAdmin, "passwordHash">;
    }
  }
}

const authenticate = async function (
  req: Request,
  _: Response,
  next: NextFunction
) {
  const authToken =
    req.cookies?.[JWT_COOKIE_NAME] || req.headers?.[JWT_COOKIE_NAME];

  if (!authToken) throw new UnAuthorizedError();
  try {
    const decoded = authService.verifyAuthToken(authToken);

    // Fetch admin from database and exclude passwordHash
    const admin = await Admin.findById(decoded._id)
      .select("-passwordHash")
      .lean();

    if (!admin) {
      throw new UnAuthorizedError("Admin not found");
    }

    // Set req.user directly to the admin object
    req.user = admin as Omit<IAdmin, "passwordHash">;

    next();
  } catch (error) {
    const errors = ["TokenExpiredError", "NotBeforeError", "JsonWebTokenError"];
    if (error instanceof Error && errors.includes(error.name))
      throw new UnAuthorizedError();

    next(error);
  }
};

const hasRole =
  (...allowedRoles: AdminRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (user?.isSuperAdmin) {
      return next();
    }

    const userRoles = user?.roles || [];

    const isAuthorized =
      Array.isArray(userRoles) &&
      userRoles.some((role) => allowedRoles.includes(role));

    if (!isAuthorized) {
      throw new UnAuthorizedError();
    }

    next();
  };

const requireSuperAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (!user?.isSuperAdmin) {
    throw new UnAuthorizedError("Super admin access required");
  }

  next();
};

export { authenticate, hasRole, requireSuperAdmin };
