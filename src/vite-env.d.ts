/// <reference types="vite/client" />
/// <reference types="vite-plugin-pages/client-react" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** ID de cliente web de Google (Google Cloud Console). Sin definir, el botón «Continuar con Google» no se muestra. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_FEATURE_IA_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
