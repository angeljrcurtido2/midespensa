import type { ReactNode } from 'react';
import { useCerrarVentana } from '../hooks/useAlVolverALaVentana';

interface Props {
  titulo: string;
  /** Ruta del listado al que se vuelve (se cierra esta ventana). */
  volverA: string;
  textoVolver: string;
  children: ReactNode;
  /** Ancho máximo del contenido (clases de Tailwind). */
  ancho?: string;
  /** Evita crear un contenedor de scroll que bloquee elementos sticky del formulario. */
  stickyContenido?: boolean;
}

/** Marco de las pantallas de alta y edición (cliente, proveedor, producto…): título, botón para volver y el formulario. */
export default function PaginaFormulario({ titulo, volverA, textoVolver, children, ancho = 'max-w-none', stickyContenido = false }: Props) {
  const cerrar = useCerrarVentana();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{titulo}</h1>
        <button
          type="button"
          onClick={() => cerrar(volverA)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {textoVolver}
        </button>
      </header>
      <div className={`relative mx-auto w-full ${stickyContenido ? 'overflow-x-clip' : 'overflow-x-auto'} p-4 ${ancho}`}>{children}</div>
    </div>
  );
}
