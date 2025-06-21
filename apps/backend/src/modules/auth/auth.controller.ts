import { Request, Response } from "express";

import { UnAuthorizedError } from "../../config/errors";
import { env } from "../../config/env";

import { successResponse } from "../../utils/response";
import { generateAdminToken } from "../../utils/token";
import { JWT_COOKIE_NAME } from "../../utils/cookie-names";

import authService from "./auth.service";

class AuthController {
  async login(req: Request, res: Response) {
    const { password } = req.body;
    const isValidPassword = await authService.validatePassword(password);

    if (!isValidPassword) throw new UnAuthorizedError("Invalid Password");

    const jwt = generateAdminToken();

    res.cookie(JWT_COOKIE_NAME, jwt, env.COOKIE_CONFIG);

    res.send(successResponse("User login successful"));
  }

  async logout(_: Request, res: Response) {
    res.clearCookie(JWT_COOKIE_NAME, env.COOKIE_CONFIG);

    res.send(successResponse("User logged out successfully"));
  }

  async verifyAccess(_req: Request, res: Response) {
    res.send(successResponse("User verified successfully"));
  }
}

export default new AuthController();
