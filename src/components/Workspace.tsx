import { Suspense, useEffect } from 'react';
import { useLocation, useNavigate, useRoutes } from 'react-router-dom';
import routes from '~react-pages';
import { useTabsStore } from '../../store/useTabsStore';
import { normalizarRuta, tituloDeRuta } from '../utils/tituloRuta';
import { VentanaActivaContext, VentanaRutaContext } from '../hooks/useAlVolverALaVentana';
import ErrorPantalla from './ErrorPantalla';

const INICIO = '/dashboard';
/** Rutas que no son ventanas de trabajo (el inicio de sesión): no llevan pestaña. */
const SIN_PESTANA = new Set(['/', '/login']);

function Pantalla({ ruta }: { ruta: string }) {
  return useRoutes(routes, ruta);
}

/**
 * Espacio de trabajo con ventanas: cada pantalla que se abre queda como pestaña (con su X) y conserva lo que se
 * estaba haciendo, así se puede dejar una venta a medias, consultar otra pantalla y volver sin perder nada.
 */
export default function Workspace() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const ruta = normalizarRuta(pathname);
  const tabs = useTabsStore((s) => s.tabs);
  const abrir = useTabsStore((s) => s.abrir);
  const cerrar = useTabsStore((s) => s.cerrar);
  const cerrarOtras = useTabsStore((s) => s.cerrarOtras);

  useEffect(() => {
    // El inicio de la app ("/") es el tablero: se abre como la pestaña "Inicio".
    if (ruta === '/') navigate(INICIO, { replace: true });
    else if (!SIN_PESTANA.has(ruta)) abrir(ruta, ruta);
  }, [ruta, abrir, navigate]);

  const lista = tabs.includes(ruta) ? tabs : [...tabs, ruta];

  const cerrarVentana = (r: string) => {
    const siguiente = cerrar(r);
    if (r === ruta) navigate(siguiente ?? INICIO);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div
        role="tablist"
        aria-label="Ventanas abiertas"
        className="sticky top-0 z-30 flex items-end gap-1 overflow-x-auto border-b border-slate-300 bg-slate-200 px-2 pt-2 dark:border-slate-700 dark:bg-slate-800"
      >
        {lista.filter((r) => !SIN_PESTANA.has(r)).map((r) => {
          const activa = r === ruta;
          const cerrable = r !== INICIO;
          return (
            <div
              key={r}
              role="presentation"
              onAuxClick={(e) => {
                if (e.button === 1 && cerrable) {
                  e.preventDefault();
                  cerrarVentana(r);
                }
              }}
              className={`group flex flex-none items-center rounded-t-lg border border-b-0 text-sm font-semibold transition-colors ${
                activa
                  ? 'border-slate-300 bg-white text-blue-700 dark:border-slate-600 dark:bg-slate-900 dark:text-blue-300'
                  : 'border-transparent bg-slate-100 text-slate-600 hover:bg-white dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activa}
                onClick={() => navigate(r)}
                className="max-w-[200px] truncate px-3 py-2"
              >
                {tituloDeRuta(r)}
              </button>
              {cerrable && (
                <button
                  type="button"
                  aria-label={`Cerrar ${tituloDeRuta(r)}`}
                  onClick={() => cerrarVentana(r)}
                  className="mr-1 flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
        {lista.filter((r) => !SIN_PESTANA.has(r)).length > 2 && (
          <button
            type="button"
            onClick={() => cerrarOtras(ruta)}
            className="mb-1 ml-auto flex-none whitespace-nowrap px-3 py-1 text-xs font-semibold text-slate-500 hover:text-red-600"
          >
            Cerrar las demás
          </button>
        )}
      </div>

      <div className="flex-1">
        {lista.map((r) => (
          // En portátiles (1280 a 1535 px, p. ej. 1366×768) se achica el contenido un 20 % para que cada pantalla
          // se vea con el mismo diseño que en un monitor grande (formulario + panel al costado) y no se apile hacia abajo.
          <div key={r} role="tabpanel" className={r === ruta ? 'xl:max-2xl:[zoom:0.8]' : 'hidden'}>
            <VentanaRutaContext.Provider value={r}>
              <VentanaActivaContext.Provider value={r === ruta}>
                <ErrorPantalla clave={r} onCerrarVentana={() => cerrarVentana(r)}>
                  <Suspense fallback={<div className="p-8 text-center text-sm text-gray-400" aria-busy="true">Cargando…</div>}>
                    <Pantalla ruta={r} />
                  </Suspense>
                </ErrorPantalla>
              </VentanaActivaContext.Provider>
            </VentanaRutaContext.Provider>
          </div>
        ))}
      </div>
    </div>
  );
}
