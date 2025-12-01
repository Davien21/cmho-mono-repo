import { NextFunction, Request, Response } from 'express';

import mongoose from 'mongoose';

import logger from '../config/logger';
import { errorResponse } from '../utils/response';

const errorNames = ['CastError', 'ValidationError', 'SyntaxError', 'MongooseError', 'MongoError'];

const errorMiddleware = function (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const errorMessage = (error as { message?: string })?.message ?? String(error);
  // can log errors to a file or a service here
  logger.error(errorMessage);

  const errorObj = error as {
    isOperational?: boolean;
    statusCode?: number;
    message?: string;
    name?: string;
  };

  if (errorObj.isOperational) {
    return res
      .status(errorObj.statusCode ?? 500)
      .send(errorResponse(errorObj.message ?? 'An error occurred'));
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const errorMessages = Object.values(error.errors).map((e) => e.message);
    return res.status(400).send(errorResponse(errorMessages[0]));
  }

  if (errorObj.name && errorNames.includes(errorObj.name)) {
    return res.status(400).send(errorResponse(errorObj.message ?? 'Bad request'));
  }

  if (
    typeof error !== 'string' &&
    (typeof error !== 'object' || error === null || !('message' in error))
  ) {
    return res.status(500).send(errorResponse('Unexpected response format'));
  }

  // default to 500 server error
  return res.status(500).send(errorResponse(errorMessage));
};

export default errorMiddleware;
