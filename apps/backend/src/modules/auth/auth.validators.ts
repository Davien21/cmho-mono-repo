import * as yup from 'yup';

export const signUp = yup.object().shape({
  name: yup.string().required(),
  email: yup.string().email().required(),
  password: yup.string().required().min(8).max(255),
  // otp: yup.string().required(),
});

export const login = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required().min(8).max(255),
});

export const verifyOtp = yup.object().shape({
  email: yup.string().email().required(),
  otp: yup.string().required(),
});

export const verifyPasswordOtp = yup.object().shape({
  email: yup.string().email().required(),
  otp: yup.string().required(),
});

export const passwordResetSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
  otp: yup.string().required(),
});
