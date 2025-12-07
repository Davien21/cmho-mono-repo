import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

export const extraHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=()");

  // Only set restrictive cross-origin policies in development
  // In production, these conflict with CORS when frontend and backend are on different domains
  if (env.NODE_ENV === "development") {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  } else {
    // In production, use cross-origin to allow CORS requests
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  }

  next();
};
