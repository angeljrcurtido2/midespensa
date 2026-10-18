import { Suspense, useEffect } from 'react';
import { useLocation, useNavigate, useRoutes } from 'react-router-dom';
import routes from '~react-pages';
import { normalizarRuta } from '../utils/tituloRuta';
import { VentanaActivaContext, VentanaRutaContext } from '../hooks/useAlVolverALaVentana';
import ErrorPantalla from './ErrorPantalla';

const INICIO = '/dashboard';

function Pantalla({ ruta }: { ruta: string }) {
  return useRoutes(routes, ruta);
}

/**
 * Versión gratuita: una pantalla a la vez, sin pestañas. (El sistema de pago conserva las ventanas abiertas.)
 */
export default function Workspace() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const ruta = normalizarRuta(pathname);

  useEffect(() => {
    if (ruta === '/') navigate(INICIO, { replace: true });
  }, [ruta, navigate]);

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      {/* En portátiles (1280 a 1535 px) se achica el contenido un 20 % para que cada pantalla conserve su diseño de monitor grande. */}
      <div className="flex-1 xl:max-2xl:[zoom:0.8]">
        <VentanaRutaContext.Provider value={ruta}>
          <VentanaActivaContext.Provider value={true}>
            <ErrorPantalla clave={ruta} onCerrarVentana={() => navigate(INICIO)}>
              <Suspense fallback={<div className="p-8 text-center text-sm text-gray-400" aria-busy="true">Cargando…</div>}>
                <Pantalla key={ruta} ruta={ruta} />
              </Suspense>
            </ErrorPantalla>
          </VentanaActivaContext.Provider>
        </VentanaRutaContext.Provider>
      </div>
    </div>
  );
}
