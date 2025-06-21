import "express-async-errors";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";

import { NotFoundError } from "../src/config/errors";
import errorMiddleware from "../src/middlewares/error";
import routes from "../src/config/routes";
import { env, parseEnv } from "../src/config/env";
import logger from "../src/config/logger";
import openDBConnection from "../src/config/db";
import { CookieNames } from "./utils/cookie-names";
import helmet from "helmet";
import { extraHeaders } from "./middlewares/extra-headers";

const app = express();
openDBConnection();

parseEnv();

const PORT = env.PORT;
const mode = env.NODE_ENV;

app.use(helmet()); // sets most basics

// Add the rest manually
app.use(extraHeaders);

app.use(morgan("dev"));

const allowedOrigins = [
  env.CLIENT_URL,
  "https://cmho.xyz",
  "https://www.cmho.xyz",
  "https://salary.cmho.xyz",
  "https://cmho-salary-manager-app.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    allowedHeaders: [
      ...CookieNames,
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
    methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);

// @ts-ignore
app.use(compression());

// Raw body middleware for webhook endpoints (must come before express.json)
app.use("/api/v1/webhooks", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "1mb", type: "application/json" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/ping", (_, res) => res.send(`Live`));
app.use("/api/v1/ping", (_req, res) => res.send(`Live`));
app.use("/api/v1", routes);

// 404 and Error Handling
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError());
});
app.use(errorMiddleware);

app.listen(PORT, () => {
  logger.info(`app listening at port ${PORT} in ${mode} mode`);
});

export default app;
