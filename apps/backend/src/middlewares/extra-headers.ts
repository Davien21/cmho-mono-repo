import { NextFunction, Request, Response } from "express";

export const extraHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip restrictive headers for OPTIONS preflight requests
  // CORS middleware handles these, and restrictive headers can interfere
  if (req.method === "OPTIONS") {
    return next();
  }

  res.setHeader("Content-Security-Policy", "default-src 'self'");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  next();
};
