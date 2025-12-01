import { Request, Response } from "express";

import { UnAuthorizedError } from "../../config/errors";
import { env } from "../../config/env";

import { successResponse } from "../../utils/response";
import { generateAuthToken } from "../../utils/token";
import { JWT_COOKIE_NAME } from "../../utils/cookie-names";

import authService from "./auth.service";
import adminService from "../admins/admins.service";
import { IAdminLogin } from "../admins/admins.types";

class AuthController {
  async login(req: Request, res: Response) {
    const credentials = req.body as IAdminLogin;

    const admin = await adminService.findByEmail(credentials.email);

    if (!admin)
      throw new UnAuthorizedError("Invalid Email or Password");

    const isValidPassword = await authService.validatePassword(
      credentials.password,
      admin.passwordHash
    );

    if (!isValidPassword)
      throw new UnAuthorizedError("Invalid Email or Password");

    const jwt = generateAuthToken({
      _id: admin._id,
      email: admin.email,
      isSuperAdmin: admin.isSuperAdmin,
      roles: admin.roles,
    });

    const adminObject = admin.toObject();
    const { passwordHash, __v, ...safeAdmin } = adminObject;

    res.cookie(JWT_COOKIE_NAME, jwt, env.COOKIE_CONFIG);

    res.send(successResponse("Admin login successful", safeAdmin));
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
