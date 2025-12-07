import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env";
import { AdminRole } from "../admins/admins.types";

export interface AuthTokenPayload extends JwtPayload {
  _id: string;
  email?: string;
  name?: string;
  isSuperAdmin?: boolean;
  roles?: AdminRole[];
}

class AuthService {
  verifyAuthToken(token: string): AuthTokenPayload {
    return jwt.verify(token, env.JWT_SECRET_KEY) as AuthTokenPayload;
  }

  async validatePassword(
    input: string,
    passwordHash: string
  ): Promise<boolean> {
    if (!passwordHash) {
      return false;
    }

    return bcrypt.compare(input, passwordHash);
  }

  async validPassword(input: string, passwordHash: string): Promise<boolean> {
    return this.validatePassword(input, passwordHash);
  }
}

const authService = new AuthService();

export default authService;
