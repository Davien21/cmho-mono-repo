import { env } from "../config/env";
import { format } from "winston";

const { printf } = format;

export const logFormat = printf(
  ({ level, message, label, timestamp, stack }) => {
    if (message && typeof message === "object") {
      if ("error" in message) message = message.error;
      else message = JSON.stringify(message);
    }
    message = String(message).replace(/[[\d]+m/g, "");
    return `${timestamp}\n[${label}] ${level}:\n${stack || message}\n`;
  }
);

export const getLogSetting = () => {
  const { json, label, timestamp, errors } = format;
  const formatSetting = [
    label({ label: env.APP_NAME }),
    timestamp(),
    errors({ stack: true }),
  ];

  if (env.NODE_ENV === "production") formatSetting.push(json());
  else formatSetting.push(logFormat);

  return formatSetting;
};
