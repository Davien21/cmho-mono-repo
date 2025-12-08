import * as yup from "yup";
import { AdminRole } from "./admins.types";
import { paginationQuerySchema } from "../../validators/general.validator";

export const createAdminSchema = yup
  .object({
    name: yup.string().required().label("Name"),
    email: yup.string().email().required().label("Email"),
    password: yup.string().min(6).required().label("Password"),
    roles: yup
      .array()
      .of(yup.string().oneOf(Object.values(AdminRole)))
      .label("Roles"),
    isSuperAdmin: yup.boolean().label("Super Admin"),
  })
  .required();

export const updateAdminSchema = yup.object({
  name: yup.string().label("Name"),
  email: yup.string().email().label("Email"),
  password: yup.string().min(6).label("Password"),
  roles: yup
    .array()
    .of(yup.string().oneOf(Object.values(AdminRole)))
    .label("Roles"),
  isSuperAdmin: yup.boolean().label("Super Admin"),
  status: yup
    .string()
    .oneOf(["active", "inactive", "deleted"])
    .label("Status"),
});

export const getAdminsSchema = paginationQuerySchema;

export type GetAdminsQuerySchema = yup.InferType<typeof getAdminsSchema>;


