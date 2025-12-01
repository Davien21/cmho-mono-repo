import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AdminRole, IAdmin } from '../modules/admins/admins.types';
import { AuthTokenPayload } from '../modules/auth/auth.service';

interface ITokenOptions {
  length: number;
  range: string[] | number[];
  prefix: string;
}

const generateToken = ({ length, range, prefix }: ITokenOptions) => {
  prefix = prefix || '';
  let token = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * range.length);
    token += range[randomIndex];
  }
  return prefix + token;
};

const generateSignUpToken = () => {
  const range = Array.from(Array(10).keys());
  const tokenOptions = { length: 5, range, prefix: 'SZ-' };
  const newToken = generateToken(tokenOptions);

  return newToken;
};

const generateAuthToken = (
  user: Pick<IAdmin, '_id' | 'email' | 'isSuperAdmin' | 'roles'>
): string => {
  const payload: AuthTokenPayload = {
    _id: String(user._id),
    email: user.email,
    isSuperAdmin: user.isSuperAdmin,
    roles: user.roles,
  };

  return jwt.sign(payload, env.JWT_SECRET_KEY, { expiresIn: '1d' });
};

const generateAdminToken = (options?: {
  _id?: string;
  isSuperAdmin?: boolean;
  roles?: AdminRole[];
}): string => {
  const { _id = 'Admin', isSuperAdmin = true, roles = [] } = options || {};

  const payload: AuthTokenPayload = {
    _id,
    isSuperAdmin,
    roles,
  };

  return jwt.sign(payload, env.JWT_SECRET_KEY, { expiresIn: '1d' });
};

const generateRandomString = (length = 64) =>
  [...crypto.getRandomValues(new Uint8Array(length))]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');

const generateSha256 = async (plainText: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export {
  generateSignUpToken,
  generateAuthToken,
  generateRandomString,
  generateSha256,
  generateAdminToken,
};
