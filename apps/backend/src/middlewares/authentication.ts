import { NextFunction, Request, Response } from 'express';

import { UnAuthorizedError } from '../config/errors';
import authService, { AuthTokenPayload } from '../modules/auth/auth.service';
import { AdminRole } from '../modules/admins/admins.types';
import { JWT_COOKIE_NAME } from '../utils/cookie-names';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

const authenticate = async function (req: Request, _: Response, next: NextFunction) {
  const authToken = req.cookies?.[JWT_COOKIE_NAME] || req.headers?.[JWT_COOKIE_NAME];

  if (!authToken) throw new UnAuthorizedError();
  try {
    const decoded = authService.verifyAuthToken(authToken);
    // Attach decoded token payload to the request for downstream middlewares/controllers.
    req.user = decoded;

    next();
  } catch (error) {
    const errors = ['TokenExpiredError', 'NotBeforeError', 'JsonWebTokenError'];
    if (error instanceof Error && errors.includes(error.name)) throw new UnAuthorizedError();

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
      Array.isArray(userRoles) && userRoles.some((role) => allowedRoles.includes(role));

    if (!isAuthorized) {
      throw new UnAuthorizedError();
    }

    next();
  };

export { authenticate, hasRole };
