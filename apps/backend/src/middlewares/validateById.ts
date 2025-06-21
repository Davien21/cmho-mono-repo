import { NextFunction, Request, Response } from "express";
import * as Yup from "yup";
import { BadRequestError } from "../config/errors";

function validateById(errorMessage: string = "Invalid id") {
  const paramId = Yup.object({
    id: Yup.string()
      .matches(/^[0-9a-fA-F]{24}$/, errorMessage)
      .required(),
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await paramId.validate(req.params);
      next();
    } catch (error) {
      throw new BadRequestError(error.message);
    }
  };
}

export default validateById;
