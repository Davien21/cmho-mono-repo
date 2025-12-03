import * as yup from "yup";

export const mediaUpload = yup.object({
  file: yup.string().optional(),
});
