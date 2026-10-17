'use client';

import { Outlet } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Suspense, createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { useLicenciaStore } from '../../store/useLicenciaStore';
import { generateNavItems, rutaPermitida, type PermisosMenu } from '../utils/generateNavItems';
import { getMiLicencia } from '../services/licencias';
import { setIaDeLaCuenta, IA_HABILITADA } from '../config/featureFlags';
import AsistenteTuki from './asistente/AsistenteTuki';
import { getDataUser } from '../services/usuarios';
import { cerrarSesionApi } from '../services/login';
import { getMisPermisos } from '../services/accesos';
import { limpiarCachePermisos } from '../hooks/usePermisos';
import { EVENTO_LICENCIA_VENCIDA } from '../lib/axiosConfig';
import AppSidebar from './Sidebar';
import BannerLicencia from './BannerLicencia';
import PantallaBloqueo from './PantallaBloqueo';

interface SidebarLayoutProps {
  children?: ReactNode;
}

/**
 * Layout persistente. Cada pantalla envuelve su contenido en <SidebarLayout>, y eso hacía que al cambiar de opción
 * del menú se destruyera y volviera a crear TODO (sidebar con su submenú abierto, nombre del usuario, permisos,
 * licencia): se veía como un parpadeo en blanco. Ahora main.tsx monta UNA sola vez <ShellPersistente> y las pantallas
 * que vuelven a pedir <SidebarLayout> dentro de él solo aportan su contenido.
 */
const ShellPersistenteContext = createContext(false);

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const dentroDelShell = useContext(ShellPersistenteContext);
  if (dentroDelShell) return <>{children ?? <Outlet />}</>;
  return <SidebarLayoutCompleto>{children}</SidebarLayoutCompleto>;
}

/** Sidebar + banner + contenido, montado una sola vez para todas las pantallas autenticadas. */
export function ShellPersistente({ children }: SidebarLayoutProps) {
  return (
    <ShellPersistenteContext.Provider value={true}>
      <SidebarLayoutCompleto>
        {/* El Suspense va DENTRO del shell: mientras llega el código de la pantalla nueva el menú sigue en su lugar. */}
        <Suspense fallback={<div className="p-8 text-center text-sm text-gray-400" aria-busy="true">Cargando…</div>}>{children}</Suspense>
        {/* Tuki, el asistente (chat): disponible en todas las pantallas cuando la cuenta tiene IA. */}
        {IA_HABILITADA && <AsistenteTuki />}
      </SidebarLayoutCompleto>
    </ShellPersistenteContext.Provider>
  );
}

function SidebarLayoutCompleto({ children }: SidebarLayoutProps) {
  const userRole = useUserStore((state) => state.userRole);
  const navigate = useNavigate();
  // useLocation y no window.location: con HashRouter la ruta real vive en el
  // hash, y window.location.pathname es siempre '/'.
  const location = useLocation();
  // Arranca colapsado por debajo de lg: con el valor fijo en true el sidebar se
  // montaba desplegado y tapaba 288px de los 390px de una pantalla de móvil.
  // Desde lg sigue abriéndose por defecto, como siempre.
  const [isExpanded, setIsExpanded] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 1024
  );
  useEffect(() => {
    let estabaEnEscritorio = window.innerWidth >= 1024;
    const sincronizarSidebarConAncho = () => {
      const esEscritorio = window.innerWidth >= 1024;
      if (esEscritorio === estabaEnEscritorio) return;
      estabaEnEscritorio = esEscritorio;
      setIsExpanded(esEscritorio);
    };
    window.addEventListener('resize', sincronizarSidebarConAncho);
    return () => window.removeEventListener('resize', sincronizarSidebarConAncho);
  }, []);
  // Habilita el ítem del panel de licencias en el menú. Sólo cosmético: el
  // acceso real lo controla requireProveedor en el backend.
  const [esProveedor, setEsProveedor] = useState(false);
  const [esFuncionario, setEsFuncionario] = useState(false);
  const [permisosMenu, setPermisosMenu] = useState<PermisosMenu>(null);
  // Hasta saber quién es (permisos y marca de proveedor) no se decide si la ruta está permitida.
  const [permisosListos, setPermisosListos] = useState(false);
  const [proveedorListo, setProveedorListo] = useState(false);

  const licencia = useLicenciaStore((s) => s.licencia);
  const bloqueada = useLicenciaStore((s) => s.bloqueada);
  const datosBloqueo = useLicenciaStore((s) => s.datosBloqueo);
  const setLicencia = useLicenciaStore((s) => s.setLicencia);
  const bloquear = useLicenciaStore((s) => s.bloquear);
  const limpiarLicencia = useLicenciaStore((s) => s.limpiar);

  useEffect(() => {
    const stored = localStorage.getItem('usuario');
    if (!userRole && !stored) {
      navigate('/login');
    }
  }, [userRole]);

  // Estado de la licencia. Se consulta en cada montaje del layout y además al
  // cambiar de pantalla: con HashRouter la navegación interna no remonta este
  // componente, así que una dependencia en [userRole] —que no cambia una vez
  // hidratado el store— dejaba el aviso sin actualizarse durante toda la sesión.
  useEffect(() => {
    const stored = localStorage.getItem('usuario');
    if (!userRole && !stored) return;

    getMiLicencia()
      .then((res) => {
        setLicencia(res.data);
        // Si el proveedor cambió la IA de esta cuenta mientras había sesión, se recarga una vez para aplicarlo.
        if (setIaDeLaCuenta(res.data.ia_habilitada !== 0)) window.location.reload();
      })
      // Un fallo al consultar la licencia no debe trabar el sistema: si algo
      // anda mal, el backend igual bloquea por su cuenta en cada request.
      .catch(() => undefined);
  }, [userRole, location.pathname]);

  // Marca de proveedor: decide si se ofrece el panel de licencias en el menú.
  useEffect(() => {
    const stored = localStorage.getItem('usuario');
    if (!userRole && !stored) return;

    getDataUser()
      .then((res: any) => {
        setEsProveedor(res.data?.esProveedor === true);
        setEsFuncionario(res.data?.tipo === 'funcionario');
      })
      .catch(() => setEsProveedor(false))
      .finally(() => setProveedorListo(true));
  }, [userRole]);

  // Permisos por módulo: el menú muestra sólo lo que la persona puede ver.
  // Ante un error se dejan en null y el menú cae al filtro por rol, para no
  // dejar a nadie sin navegación por un problema de red.
  useEffect(() => {
    const stored = localStorage.getItem('usuario');
    if (!userRole && !stored) return;

    getMisPermisos()
      .then((res) => {
        const data = res.data?.data;
        // El administrador entra a todo: no hace falta filtrar nada.
        setPermisosMenu(data?.esAdministrador ? null : data?.permisos || null);
      })
      .catch(() => setPermisosMenu(null))
      .finally(() => setPermisosListos(true));
  }, [userRole]);

  // Cualquier request que choque con la licencia vencida dispara el bloqueo,
  // aunque la consulta inicial lo haya visto activo (por ejemplo, si venció
  // mientras la sesión estaba abierta).
  useEffect(() => {
    const onVencida = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      bloquear({
        fecha_vencimiento: detail.fecha_vencimiento,
        plan: detail.plan,
        monto: detail.monto,
        mensaje: detail.mensaje,
        estado: detail.estado,
      });
    };

    window.addEventListener(EVENTO_LICENCIA_VENCIDA, onVencida);
    return () => window.removeEventListener(EVENTO_LICENCIA_VENCIDA, onVencida);
  }, [bloquear]);

  const cerrarSesion = async () => {
    // El logout del backend borra la cookie httpOnly del token. Sin esta
    // llamada la cookie sobrevive al cierre de sesión —el cliente no puede
    // borrarla por su cuenta— y el próximo usuario que entre en este navegador
    // queda autenticado como el anterior.
    try {
      await cerrarSesionApi();
    } catch {
      // Si falla, igual se limpia el lado del cliente: quedarse dentro por un
      // error de red sería peor.
    }

    localStorage.removeItem('usuario');
    localStorage.removeItem('auth_token');
    limpiarLicencia();
    // Sin esto el próximo usuario que entre en este navegador heredaría los
    // permisos cacheados del anterior.
    limpiarCachePermisos();
    navigate('/login');
  };

  // Gate de sesión SÍNCRONO. Antes el guard vivía sólo en un useEffect, que corre
  // DESPUÉS del primer render: los componentes hijos del dashboard (EcommerceMetrics,
  // gráficos de ventas/compras/ganancias) montaban a la par y disparaban ~7 fetch sin
  // token, cada uno devolviendo 401 y ensuciando la consola antes de que la redirección
  // a /login se completara. Al no renderizar el contenido cuando falta auth_token,
  // ningún hijo monta ni pide datos sin sesión.
  const tieneSesion =
    typeof window !== 'undefined' && !!localStorage.getItem('auth_token');

  if (!tieneSesion) {
    // navigate dentro de efecto para no llamar durante el render.
    return <RedirigirALogin navigate={navigate} />;
  }

  // Reemplaza al sistema entero: no se renderiza el sidebar ni el contenido.
  if (bloqueada) {
    return (
      <PantallaBloqueo
        fechaVencimiento={datosBloqueo?.fecha_vencimiento}
        plan={datosBloqueo?.plan}
        monto={datosBloqueo?.monto}
        mensaje={datosBloqueo?.mensaje}
        estado={datosBloqueo?.estado}
        esFuncionario={esFuncionario}
        onCerrarSesion={cerrarSesion}
      />
    );
  }

  // Opciones que el proveedor ocultó para esta cuenta (licencias.lector_barras_web = 0).
  const lectorOculto = licencia?.lector_barras_web === 0;
  const RUTA_LECTOR = '/lector-codigo-barra-web';
  const navItems = generateNavItems(userRole, esProveedor, permisosMenu)
    .map((item) => (item.subItems && lectorOculto ? { ...item, subItems: item.subItems.filter((s) => s.path !== RUTA_LECTOR) } : item))
    .filter((item) => !item.subItems || item.subItems.length > 0);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Botón para abrir el menú por debajo de lg. Sin él el sidebar quedaba
          completamente fuera de pantalla en móvil y no había forma de navegar:
          medido, 0px visibles y ningún disparador fuera del propio sidebar. */}
      {!isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          aria-label="Abrir menú"
          className="lg:hidden fixed top-3 left-3 z-[60] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-3 text-white shadow-lg"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Fondo oscuro para cerrar el menú tocando fuera, sólo en móvil. */}
      {isExpanded && (
        <div
          onClick={() => setIsExpanded(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          aria-hidden="true"
        />
      )}

      <AppSidebar
        navItems={navItems}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      {/* El margen que compensa al sidebar sólo se aplica desde lg. Antes era fijo
          (ml-72 / ml-24) en todos los tamaños: con un viewport de 390px el sidebar
          ocupaba 288px y empujaba el contenido fuera de la pantalla, dejando el
          documento en 651px de ancho y scroll horizontal en toda la app.
          min-w-0 permite que el contenido encoja en lugar de estirar el layout. */}
      <main
        className={`transition-all duration-300 flex-1 min-w-0 ${isExpanded ? 'lg:ml-72' : 'lg:ml-24'}`}
      >
        <div className="px-4 pt-4">
          <BannerLicencia licencia={licencia} />
        </div>
        {(lectorOculto && location.pathname.replace(/\/+$/, '') === RUTA_LECTOR) || (permisosListos && proveedorListo && !rutaPermitida(location.pathname, permisosMenu, esProveedor)) ? (
          <div className="p-8 text-center" data-testid="sin-acceso">
            <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-100">No tenés acceso a esta sección</h1>
            <p className="mb-4 text-gray-600 dark:text-gray-300">Tu usuario no tiene permiso para ver esta pantalla. Si la necesitás, pedíselo al titular de la cuenta.</p>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              Volver al inicio
            </button>
          </div>
        ) : (
          children ?? <Outlet />
        )}
      </main>
    </div>
  );
}

// Redirige a /login desde un efecto (no durante el render) y no monta contenido,
// evitando que las páginas protegidas disparen peticiones sin sesión.
function RedirigirALogin({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);
  return null;
}
