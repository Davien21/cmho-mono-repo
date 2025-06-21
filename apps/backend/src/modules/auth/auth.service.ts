import jwt from "jsonwebtoken";
import { env } from "../../config/env";

class AuthService {
  verifyAuthToken(token: string) {
    return jwt.verify(token, env.JWT_SECRET_KEY);
  }

  async validatePassword(input: string): Promise<boolean> {
    return input === env.PLATFORM_PASSWORD;
  }
}

export default new AuthService();
