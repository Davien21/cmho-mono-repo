/// <reference types="vite/client" />

// src/env.ts

const env = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
};

type Key = keyof typeof env;

for (const key in env) {
  // This is fine, anything in vite env should not be a sensitive secret anyway
  if (!env[key as Key]) throw new Error(`${key} is not set`);
}

export { env };
