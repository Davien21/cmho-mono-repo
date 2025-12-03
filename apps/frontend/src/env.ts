/// <reference path="./env.d.ts" />

// src/env.ts
// RSBuild environment variable handling
// Uses PUBLIC_ prefix for client-side variables

interface Env {
  API_BASE_URL: string;
}

// Auto-detect API base URL based on current hostname in development
// In production: use env variable
const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  if (import.meta.env.DEV) return `http://${hostname}:3001/api/v1`;

  return import.meta.env.PUBLIC_API_BASE_URL || "";
};

const env: Env = {
  API_BASE_URL: getApiBaseUrl(),
};

// Validate required environment variables
const requiredVars: (keyof Env)[] = ["API_BASE_URL"];

for (const key of requiredVars) {
  if (!env[key]) {
    const varName = `PUBLIC_${key}`;
    const error = new Error(`Environment variable ${varName} is not set`);
    console.error("Environment variable error:", error);

    // Show error in UI instead of blank screen
    if (typeof document !== "undefined") {
      document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui; padding: 20px; text-align: center;">
          <div>
            <h1 style="color: #dc2626; margin-bottom: 16px;">Configuration Error</h1>
            <p style="color: #6b7280; margin-bottom: 8px;">Missing required environment variable:</p>
            <code style="background: #f3f4f6; padding: 8px 16px; border-radius: 4px; display: inline-block; color: #1f2937; margin: 8px 0;">${varName}</code>
            <p style="color: #6b7280; margin-top: 16px; font-size: 14px;">Please set this variable in your Vercel project settings.</p>
          </div>
        </div>
      `;
    }
    throw error;
  }
}

export { env };
