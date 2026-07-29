/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEVICE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}