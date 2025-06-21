import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface ITokenOptions {
  length: number;
  range: string[] | number[];
  prefix: string;
}

const generateToken = ({ length, range, prefix }: ITokenOptions) => {
  prefix = prefix || "";
  let token = "";
  for (let i = 0; i < length; i++) {
    let randomIndex = Math.floor(Math.random() * range.length);
    token += range[randomIndex];
  }
  return prefix + token;
};

const generateSignUpToken = () => {
  let range = Array.from(Array(10).keys());
  let tokenOptions = { length: 5, range, prefix: "SZ-" };
  let newToken = generateToken(tokenOptions);

  return newToken;
};

const generateAuthToken = (user: any) => {
  let dataToSign = { _id: user._id, email: user.email };
  return jwt.sign({ ...dataToSign }, env.JWT_SECRET_KEY, { expiresIn: "1d" });
};

const generateAdminToken = () => {
  return jwt.sign({ _id: "Admin" }, env.JWT_SECRET_KEY, { expiresIn: "1d" });
};

const generateRandomString = (length = 64) =>
  [...crypto.getRandomValues(new Uint8Array(length))]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");

const generateSha256 = async (plainText: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export {
  generateSignUpToken,
  generateAuthToken,
  generateRandomString,
  generateSha256,
  generateAdminToken,
};
