import { useEffect, useRef } from 'react';

/** ID de cliente web de Google. Sin él (variable VITE_GOOGLE_CLIENT_ID) el botón no se muestra. */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';

interface GoogleId {
  initialize: (cfg: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: 'popup' | 'redirect'; auto_select?: boolean; cancel_on_tap_outside?: boolean }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
}
declare global { interface Window { google?: { accounts: { id: GoogleId } } } }

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';
let cargando: Promise<void> | null = null;
const cargarScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  cargando ??= new Promise<void>((ok, fallo) => {
    const s = document.createElement('script');
    s.src = SCRIPT_URL; s.async = true; s.defer = true;
    s.onload = () => ok();
    s.onerror = () => { cargando = null; s.remove(); fallo(new Error('No se pudo cargar Google')); };
    document.head.appendChild(s);
  });
  return cargando;
};

interface Props {
  /** Llega el ID token de Google (se manda al servidor). */
  onCredential: (credential: string) => void;
  /** No se pudo cargar el botón de Google (sin internet, bloqueador, etc.). */
  onError?: (mensaje: string) => void;
  /** Mientras se está ingresando, el botón queda inactivo. */
  deshabilitado?: boolean;
}

/** Botón oficial «Continuar con Google» (Google Identity Services). Si no hay ID de cliente configurado, no dibuja nada. */
export default function BotonGoogle({ onCredential, onError, deshabilitado }: Props) {
  const caja = useRef<HTMLDivElement>(null);
  const alCredencial = useRef(onCredential); alCredencial.current = onCredential;
  const alError = useRef(onError); alError.current = onError;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let activo = true;
    cargarScript()
      .then(() => {
        if (!activo || !caja.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'popup',
          auto_select: false,
          callback: (r) => { if (r.credential) alCredencial.current(r.credential); },
        });
        caja.current.innerHTML = '';
        window.google.accounts.id.renderButton(caja.current, {
          type: 'standard', theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', logo_alignment: 'left',
          locale: 'es', width: Math.min(360, caja.current.clientWidth || 320),
        });
      })
      .catch(() => { if (activo) alError.current?.('No pudimos cargar el ingreso con Google. Revisá tu conexión o ingresá con tu usuario.'); });
    return () => { activo = false; };
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;
  return <div ref={caja} className={`flex min-h-11 w-full justify-center ${deshabilitado ? 'pointer-events-none opacity-60' : ''}`} aria-label="Continuar con Google" />;
}
