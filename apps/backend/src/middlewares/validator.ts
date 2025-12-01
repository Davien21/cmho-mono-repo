import { NextFunction, Request, Response } from 'express';
import * as Yup from 'yup';

import { BadRequestError } from '../config/errors';

const validator = (
  schema: Yup.AnySchema<unknown> | undefined,
  source: 'query' | 'body' = 'body'
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!schema) return next();

    try {
      await schema.validate(req[source]);
      next();
    } catch (error: unknown) {
      const yupError = error as { errors?: string[] };
      throw new BadRequestError(yupError?.errors?.[0] ?? 'Validation failed');
    }
  };
};

export default validator;
