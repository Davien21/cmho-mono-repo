import * as yup from "yup";
import { paginationQuerySchema } from "../../validators/general.validator";

export const getActivitiesQuerySchema = paginationQuerySchema.shape({
  module: yup.string().optional(),
  search: yup.string().optional(),
});

export type GetActivitiesQuerySchema = yup.InferType<
  typeof getActivitiesQuerySchema
>;
