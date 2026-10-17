import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Una pantalla que falla no debe dejar todo el sistema en blanco. El caso más común: el usuario tiene el sistema
 * abierto de antes y, al publicarse una versión nueva, los archivos de las pantallas cambiaron de nombre; al abrir
 * una pantalla que todavía no había cargado, el navegador no la encuentra. La solución es recargar la página.
 */

const CLAVE_RECARGA = 'sistema:recarga-por-version';

/** ¿El error es de carga de una pantalla (versión nueva publicada) y no un fallo de la pantalla en sí? */
export const esErrorDeVersion = (error: unknown): boolean => {
  const texto = `${(error as Error)?.name ?? ''} ${(error as Error)?.message ?? error ?? ''}`;
  return /dynamically imported module|Importing a module script failed|Loading chunk|Loading CSS chunk|error loading dynamically|Unexpected token '<'|is not a valid JavaScript MIME type|MIME type of "text\/html"/i.test(texto);
};

/** Recarga la página una sola vez cada 2 minutos (evita un bucle si el problema no es de versión). */
export const recargarPorVersionNueva = (): boolean => {
  try {
    const ultima = Number(sessionStorage.getItem(CLAVE_RECARGA) || 0);
    if (Date.now() - ultima < 2 * 60 * 1000) return false;
    sessionStorage.setItem(CLAVE_RECARGA, String(Date.now()));
  } catch { /* sin almacenamiento: se recarga igual */ }
  window.location.reload();
  return true;
};

interface Props {
  children: ReactNode;
  /** Cierra la ventana (pestaña) que falló; si no se pasa, no se ofrece el botón. */
  onCerrarVentana?: () => void;
  /** Cambia cuando se abre otra pantalla: limpia el error anterior. */
  clave?: string;
}

interface Estado { error: Error | null; version: boolean }

export default class ErrorPantalla extends Component<Props, Estado> {
  state: Estado = { error: null, version: false };

  static getDerivedStateFromError(error: Error): Estado {
    return { error, version: esErrorDeVersion(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error en una pantalla:', error, info.componentStack);
    if (esErrorDeVersion(error)) recargarPorVersionNueva();
  }

  componentDidUpdate(anterior: Props) {
    if (this.state.error && anterior.clave !== this.props.clave) this.setState({ error: null, version: false });
  }

  render() {
    const { error, version } = this.state;
    if (!error) return this.props.children;

    return (
      <div role="alert" className="mx-auto mt-10 max-w-xl rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center shadow-sm dark:border-amber-700/50 dark:bg-amber-900/20">
        <h2 className="text-lg font-extrabold text-amber-900 dark:text-amber-200">
          {version ? 'Hay una versión nueva del sistema' : 'Esta pantalla no se pudo abrir'}
        </h2>
        <p className="mt-2 text-sm text-amber-900/80 dark:text-amber-100/80">
          {version
            ? 'Se publicó una actualización mientras tenías el sistema abierto. Actualizá la página para seguir: no se pierde nada de lo ya guardado.'
            : 'Ocurrió un problema al mostrar esta pantalla. Podés intentarlo de nuevo o cerrar esta ventana; las demás ventanas siguen funcionando.'}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => (version ? window.location.reload() : this.setState({ error: null, version: false }))} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
            {version ? 'Actualizar ahora' : 'Reintentar'}
          </button>
          {!version && this.props.onCerrarVentana && (
            <button type="button" onClick={this.props.onCerrarVentana} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Cerrar esta ventana
            </button>
          )}
          {!version && (
            <button type="button" onClick={() => window.location.reload()} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Actualizar la página
            </button>
          )}
        </div>
        {!version && (
          <details className="mt-4 text-left text-xs text-amber-900/70 dark:text-amber-100/60">
            <summary className="cursor-pointer font-semibold">Detalle técnico (para soporte)</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{String(error.message || error)}</pre>
          </details>
        )}
      </div>
    );
  }
}
