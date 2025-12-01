// RSBuild environment variable type definitions
type ImportMetaEnv = {
  readonly PUBLIC_API_BASE_URL: string;
  readonly DEV: boolean;
  readonly MODE: string;
  readonly PROD: boolean;
  readonly BASE_URL: string;
  readonly ASSET_PREFIX: string;
};

// Extend ImportMeta at the global scope
declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
