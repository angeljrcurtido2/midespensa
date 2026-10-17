// Funciones de IA. Dos candados: el de la instalación (VITE_FEATURE_IA_ENABLED) y el de la cuenta
// (licencias.ia_habilitada en el servidor, ej. cuentas de prueba). Si cualquiera está apagado, la IA no se muestra.
const IA_INSTALACION = import.meta.env.VITE_FEATURE_IA_ENABLED === 'true';
const CLAVE_IA_CUENTA = 'ia_cuenta_habilitada';

const leerIaCuenta = () => {
  try { return localStorage.getItem(CLAVE_IA_CUENTA) !== '0'; } catch { return true; }
};

// `let` exportado: es un enlace vivo, así que los componentes ven el valor nuevo cuando se vuelven a renderizar.
export let IA_HABILITADA = IA_INSTALACION && leerIaCuenta();

/** Lo llama el login y la consulta de licencia. Devuelve true si el valor cambió (conviene recargar la pantalla). */
export const setIaDeLaCuenta = (habilitada: boolean): boolean => {
  const antes = leerIaCuenta();
  try { localStorage.setItem(CLAVE_IA_CUENTA, habilitada ? '1' : '0'); } catch { /* sin almacenamiento */ }
  IA_HABILITADA = IA_INSTALACION && habilitada;
  return antes !== habilitada;
};

// Chat IA con texto (Ollama): oculto por defecto porque la IA local es lenta. Las funciones por foto (productos,
// facturas) siguen con IA_HABILITADA. VITE_FEATURE_CHAT_IA_ENABLED=true los vuelve a mostrar.
export const CHAT_IA_HABILITADO = import.meta.env.VITE_FEATURE_CHAT_IA_ENABLED === 'true' && IA_HABILITADA;
