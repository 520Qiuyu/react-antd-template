/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NODE_ENV: string;
  readonly VITE_CAS_LOGOUT_URL: string;
  readonly VITE_CAS_LOGIN_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
