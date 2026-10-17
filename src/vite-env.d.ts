/// <reference types="vite/client" />
/// <reference types="vite-plugin-pages/client-react" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_FEATURE_IA_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
