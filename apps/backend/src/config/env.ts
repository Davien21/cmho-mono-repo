/**
 * We use dotenv to load the environment variables
 *
 * We use the zod schema to validate the environment variables
 *
 * Note, we use getValue to get the values from the environment variables or use the default values
 *
 * Using getValue with a default of undefined will throw an error if the env variable is not set, this is useful to force the developer to set those specific env variables
 */

import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const NODE_ENV_SCHEMA = z.enum(["production", "development", "test"] as const);

const schema = z.object({
  APP_NAME: z.string(),
  NODE_ENV: NODE_ENV_SCHEMA,
  PORT: z.coerce.number(),
  DATABASE_URL: z.string().includes("mongodb"),
  JWT_SECRET_KEY: z.string(),
  COOKIE_CONFIG: z.object({
    httpOnly: z.boolean(),
    domain: z.string(),
    secure: z.boolean(),
    sameSite: z.enum(["strict", "lax", "none"]),
  }),
  CLIENT_URL: z.string(),
  // Paystack Config
  PAYSTACK_SECRET_KEY: z.string(),
  // PAYSTACK_PUBLIC_KEY: z.string(),
  // PAYSTACK_BASE_URL: z.string(),
  // Platform Config
  PLATFORM_PASSWORD: z.string(),
});

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: any;
    }
  }
}

const activeEnv = (process.env.NODE_ENV ?? "development") as z.infer<
  typeof NODE_ENV_SCHEMA
>;

const APP_NAME = "cmho";
const PORT = process.env.PORT;

let API_BASE_URL = `http://localhost:${PORT}`;
let CLIENT_URL = "http://localhost:3000";
if (activeEnv === "production") {
  API_BASE_URL = `https://api.${APP_NAME}.xyz`;
  CLIENT_URL = `https://${APP_NAME}.xyz`;
}

const PUBLIC_BASE_URL = `${API_BASE_URL}/api/v1`;

const common = {
  APP_NAME,
  PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  CLIENT_URL,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  COOKIE_CONFIG: {
    httpOnly: false,
    domain: "localhost",
    secure: false,
    sameSite: "strict" as const,
  },
  // Paystack Config
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  // Platform Config
  PLATFORM_PASSWORD: process.env.PLATFORM_PASSWORD,
};

const development: z.infer<typeof schema> = {
  ...common,
  NODE_ENV: "development",
  DATABASE_URL: `mongodb://localhost:27017/${common.APP_NAME}`,
};

const test: z.infer<typeof schema> = {
  ...common,
  NODE_ENV: "test",
  DATABASE_URL: `mongodb://localhost:27017/${common.APP_NAME}_test`,
  PORT: 3002,
};

const production: z.infer<typeof schema> = {
  ...common,
  NODE_ENV: "production",
  CLIENT_URL,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  COOKIE_CONFIG: {
    httpOnly: true,
    domain: `${APP_NAME}.xyz`,
    secure: true,
    sameSite: "strict",
  },
};
const config = {
  development,
  production,
  test,
};

const getParsedErrorString = (parsed: z.ZodError) => {
  const errObj = parsed.flatten().fieldErrors;
  return Object.entries(errObj)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
};

export function parseEnv() {
  const parsed = schema.safeParse(config[activeEnv]);

  if (parsed.success === true) return parsed.data;

  const parsedErrorString = getParsedErrorString(parsed.error);
  // console.error(`❌ Invalid environment variables:`, `\n${parsedErrorString}`);
  throw new Error(`❌ Invalid environment variables:\n ${parsedErrorString}`);
}

export const env = parseEnv();
