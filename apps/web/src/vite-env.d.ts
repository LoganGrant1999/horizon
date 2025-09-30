/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_S3_PUBLIC_URL?: string;
  readonly VITE_S3_BUCKET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}