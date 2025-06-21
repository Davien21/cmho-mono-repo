import { format, createLogger, transports } from "winston";
import { getLogSetting, logFormat } from "../utils/logging";

const { combine, colorize } = format;

interface Ilogger {
  info: (message: any) => void;
  error: (message: any) => void;
}

const logger: Ilogger = createLogger({
  format: combine(...getLogSetting()),
  transports: [
    new transports.Console({
      format: combine(colorize(), logFormat),
    }),
    new transports.File({ filename: "errors.log", level: "error" }),
    new transports.File({ filename: "all-logs.log" }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: "unhandled-rejections.log" }),
  ],
});

export default logger;
