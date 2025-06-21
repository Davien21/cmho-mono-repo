import { NextFunction, Request, Response } from "express";

import mongoose from "mongoose";

import logger from "../config/logger";
import { errorResponse } from "../utils/response";

const errorNames = [
  "CastError",
  "ValidationError",
  "SyntaxError",
  "MongooseError",
  "MongoError",
];

const errorMiddleware = function (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const errorMessage = error.message ?? error;
  // can log errors to a file or a service here
  logger.error(errorMessage);

  if (error.isOperational) {
    return res.status(error.statusCode).send(errorResponse(error.message));
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const errorMessages = Object.values(error.errors).map((e) => e.message);
    return res.status(400).send(errorResponse(errorMessages[0]));
  }

  if (errorNames.includes(error.name)) {
    return res.status(400).send(errorResponse(error.message));
  }

  if (typeof error !== "string" && !("message" in error)) {
    return res.status(500).send(errorResponse("Unexpected response format"));
  }

  // default to 500 server error
  return res.status(500).send(errorResponse(errorMessage));
};

export default errorMiddleware;
