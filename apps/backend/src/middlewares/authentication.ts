import { NextFunction, Request, Response } from "express";

import { UnAuthorizedError } from "../config/errors";
import authService from "../modules/auth/auth.service";
import { JWT_COOKIE_NAME } from "../utils/cookie-names";

const authenticate = async function (
  req: Request,
  _: Response,
  next: NextFunction
) {
  const authToken =
    req.cookies?.[JWT_COOKIE_NAME] || req.headers?.[JWT_COOKIE_NAME];

  if (!authToken) throw new UnAuthorizedError();
  try {
    authService.verifyAuthToken(authToken);

    next();
  } catch (error) {
    const errors = ["TokenExpiredError", "NotBeforeError", "JsonWebTokenError"];
    if (error instanceof Error && errors.includes(error.name))
      throw new UnAuthorizedError();

    next(error);
  }
};

export { authenticate };
