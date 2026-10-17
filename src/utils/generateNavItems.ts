import {
  Squares2X2Icon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  UserGroupIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { type ComponentType, type SVGProps } from 'react';

// Configuración de email: oculta por defecto (VITE_FEATURE_EMAIL_ENABLED=true la vuelve a mostrar).
// Optional chaining: los tests corren con tsx, donde import.meta.env no existe.
const EMAIL_HABILITADO = import.meta.env?.VITE_FEATURE_EMAIL_ENABLED === 'true';

interface NavItem {
  name: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  path?: string;
  subItems?: {
    name: string;
    path: string;
    children?: { name: string; path: string }[];
  }[];
}

// `esProveedor` agrega el panel de licencias, que administra las suscripciones
// de TODOS los clientes. Es sólo cosmético: ocultar el ítem no protege nada
// —quien conozca la ruta puede entrar—, el acceso real lo impone requireProveedor
// en el backend, que responde 403 a cualquiera que no tenga la marca.
/**
 * Módulo al que pertenece cada ruta, para poder ocultarla cuando el funcionario
 * no tiene permiso de verla. Una ruta sin entrada acá se muestra siempre: son
 * las de uso general (inicio) o las que ya filtra el rol.
 */
const MODULO_POR_RUTA: Record<string, string> = {
  '/ventas': 'ventas',
  '/ventas/ventaProgramada': 'ventas',
  '/ventas/cobrodeuda': 'cobros',
  '/compras': 'compras',
  '/compras/cobrodeuda': 'pagos',
  '/movimiento/cierrecaja': 'caja',
  '/movimiento/cajas': 'caja',
  '/movimiento/ingreso': 'caja',
  '/movimiento/egreso': 'caja',
  '/movimiento/resumen': 'caja',
  '/productos': 'productos',
  '/categoria': 'productos',
  '/lector-codigo-barra-web': 'productos',
  '/publicidad': 'productos',
  '/promociones': 'productos',
  '/clientes': 'clientes',
  '/proveedor': 'proveedores',
  '/facturador': 'configuracion',
  '/contabilidad': 'contabilidad',
  '/configuracion': 'configuracion',
  '/configuracion/email': 'configuracion',
  '/usuario': 'usuarios',
  '/funcionarios': 'usuarios',
  '/accesos': 'usuarios',
  '/empleados': 'rrhh',
  '/salarios': 'rrhh',
  '/asistencia': 'rrhh',
  '/horas-extras': 'rrhh',
  '/comisiones': 'rrhh',
  '/amonestaciones': 'rrhh',
  '/movimientos-rrhh': 'rrhh',
  '/liquidaciones': 'rrhh',
};

/** Rutas que solo ve el titular de la cuenta (el backend responde 403 al resto). */
const SOLO_TITULAR = new Set(['/movimiento/cajas-en-vivo', '/mi-licencia']);
const sinSoloTitular = (items: NavItem[]): NavItem[] =>
  items.map((item) => (item.subItems ? { ...item, subItems: item.subItems.filter((s) => !SOLO_TITULAR.has(s.path)) } : item));

/** Permisos efectivos del usuario; null mientras se cargan o para el administrador. */
export type PermisosMenu = { modulo: string; ver: boolean }[] | null;

export const generateNavItems = (
  userRole: string | null,
  esProveedor = false,
  permisos: PermisosMenu = null,
): NavItem[] => {
  const allItems: NavItem[] = [
    {
      name: 'General',
      icon: Squares2X2Icon,
      subItems: [
        { name: 'Inicio', path: '/dashboard' },
        { name: 'Usuarios', path: '/usuario' },
        { name: 'Funcionarios', path: '/funcionarios' },
        { name: 'Usuarios y accesos', path: '/accesos' },
      ],
    },
    {
      name: 'Gestión',
      icon: BuildingStorefrontIcon,
      subItems: [
        { name: 'Cliente', path: '/clientes', children: [
          { name: 'Nuevo cliente', path: '/clientes/nuevo' },
          { name: 'Listar clientes', path: '/clientes' },
        ] },
        { name: 'Proveedores', path: '/proveedor', children: [
          { name: 'Nuevo proveedor', path: '/proveedor/nuevo' },
          { name: 'Listar proveedores', path: '/proveedor' },
        ] },
        { name: 'Productos', path: '/productos', children: [
          { name: 'Nuevo producto', path: '/productos/nuevo' },
          { name: 'Listar productos', path: '/productos' },
          { name: 'Alertas de inventario', path: '/productos/alertas' },
        ] },
        { name: 'Categorías', path: '/categoria', children: [
          { name: 'Nueva categoría', path: '/categoria/nueva' },
          { name: 'Listar categorías', path: '/categoria' },
        ] },
        { name: 'Lector código de barras para web', path: '/lector-codigo-barra-web' },
        { name: 'Promociones', path: '/promociones' },
        { name: 'Publicidad', path: '/publicidad' },
        { name: 'Facturador', path: '/facturador' },
      ],
    },
    {
      name: 'Finanzas',
      icon: BanknotesIcon,
      subItems: [
        { name: 'Compras', path: '/compras', children: [
          { name: 'Nueva compra', path: '/compras/nueva' },
          { name: 'Listar compras', path: '/compras' },
        ] },
        { name: 'Ventas', path: '/ventas', children: [
          { name: 'Nueva venta', path: '/ventas/nueva' },
          { name: 'Listar ventas', path: '/ventas' },
        ] },
        { name: 'Ventas Programadas', path: '/ventas/ventaProgramada' },
        { name: 'Cobro Ventas Crédito', path: '/ventas/cobrodeuda' },
        { name: 'Pago Compras Crédito', path: '/compras/cobrodeuda' },
        { name: 'Movimientos', path: '/movimiento/cierrecaja', children: [
          { name: 'Abrir caja', path: '/movimiento/cierrecaja/apertura/nueva' },
          { name: 'Listar movimientos', path: '/movimiento/cierrecaja' },
        ] },
        { name: 'Cajas', path: '/movimiento/cajas', children: [
          { name: 'Listar cajas', path: '/movimiento/cajas' },
          { name: 'Arqueos de caja', path: '/movimiento/arqueo' },
        ] },
        { name: 'Ingresos Varios', path: '/movimiento/ingreso', children: [
          { name: 'Nuevo ingreso', path: '/movimiento/ingreso/nuevo' },
          { name: 'Listar ingresos', path: '/movimiento/ingreso' },
        ] },
        { name: 'Egresos Varios', path: '/movimiento/egreso', children: [
          { name: 'Nuevo egreso', path: '/movimiento/egreso/nuevo' },
          { name: 'Listar egresos', path: '/movimiento/egreso' },
        ] },
        { name: 'Ingresos y Egresos', path: '/movimiento/resumen' },
        { name: 'Cajas en vivo', path: '/movimiento/cajas-en-vivo' },
      ],
    },
    {
      name: 'Contabilidad',
      icon: BookOpenIcon,
      subItems: [{ name: 'Libros Contables', path: '/contabilidad' }],
    },
    {
      name: 'RRHH',
      icon: UserGroupIcon,
      subItems: [
        { name: 'Empleados', path: '/empleados' },
        { name: 'Salarios', path: '/salarios' },
        { name: 'Asistencias', path: '/asistencia' },
        { name: 'Horas Extras', path: '/horas-extras' },
        { name: 'Comisiones', path: '/comisiones' },
        { name: 'Amonestaciones', path: '/amonestaciones' },
        { name: 'Bonos/Descuentos', path: '/movimientos-rrhh' },
        { name: 'Liquidaciones', path: '/liquidaciones' },
      ],
    },
    {
      name: 'Configuración',
      icon: Cog6ToothIcon,
      subItems: [
        { name: 'Configuración', path: '/configuracion' },
        ...(EMAIL_HABILITADO ? [{ name: 'Email', path: '/configuracion/email' }] : []),
        { name: 'Mi plan', path: '/mi-licencia' },
      ],
    },
  ];

  // Panel de licencias de TODOS los clientes: solo para el proveedor del sistema (el backend
  // lo exige igual con requireProveedor; ocultarlo acá es solo para que nadie más lo vea).
  if (esProveedor) {
    allItems.push({
      name: 'Proveedor',
      icon: KeyIcon,
      subItems: [{ name: 'Licencias', path: '/licencias' }],
    });
  }

  // Los permisos se evalúan ANTES que el rol. El backend ya distinguió si quien
  // consulta es administrador —en ese caso devuelve null y se cae al rol—, así
  // que recibir una lista significa que hay restricciones que aplicar. Al
  // revés, un `userRole` desactualizado en el store (por ejemplo tras cambiar
  // de sesión sin recargar) mostraría el menú completo a alguien que no
  // corresponde.
  if (permisos && permisos.length) {
    const visibles = new Set(permisos.filter((p) => p.ver).map((p) => p.modulo));

    const filtrados = allItems
      .map((item) => {
        if (!item.subItems) return item;
        const subItems = item.subItems.filter((s) => {
          if (SOLO_TITULAR.has(s.path)) return false;
          const modulo = MODULO_POR_RUTA[s.path];
          // Sin módulo asociado la ruta es de uso general y se deja pasar.
          return !modulo || visibles.has(modulo);
        });
        return { ...item, subItems };
      })
      // Un grupo sin hijos visibles no aporta nada y confunde.
      .filter((item) => !item.subItems || item.subItems.length > 0);

    return filtrados;
  }

  // Sin permisos (administrador, token viejo o error al cargarlos) se cae al
  // filtro por rol, que es más grueso pero nunca deja a nadie sin menú.
  if (userRole === 'Administrador') return allItems;

  if (userRole === 'Cajero' || userRole === 'Vendedor') {
    return sinSoloTitular(allItems.filter((item) => item.name === 'Finanzas'));
  }

  if (userRole === 'Gerente' || userRole === 'Supervisor') {
    return sinSoloTitular(allItems).filter(
      (item) =>
        item.name === 'Finanzas' ||
        item.name === 'Gestión' ||
        item.name === 'Contabilidad' ||
        item.name === 'RRHH',
    );
  }

  if (userRole === 'Almacenero') {
    return allItems.filter((item) => item.name === 'Gestión');
  }

  return [];
};

/**
 * ¿Puede esta persona abrir la ruta? Es presentación (el backend ya devuelve 403 en los datos), pero evita
 * que un funcionario que escribe la URL vea la pantalla vacía de un módulo que no le corresponde.
 *  - `permisos` null (titular, o error al cargarlos) → se deja pasar, salvo el panel de licencias.
 *  - /licencias: solo el proveedor. SOLO_TITULAR: nunca un funcionario.
 */
export const rutaPermitida = (path: string, permisos: PermisosMenu, esProveedor: boolean): boolean => {
  const ruta = (path || '/').split('?')[0].replace(/\/+$/, '') || '/';
  if (ruta === '/licencias') return esProveedor;
  const esFuncionario = !!permisos && permisos.length > 0;
  if (!esFuncionario) return true;
  if (SOLO_TITULAR.has(ruta)) return false;
  const coincidencia = Object.keys(MODULO_POR_RUTA)
    .filter((r) => ruta === r || ruta.startsWith(`${r}/`))
    .sort((a, b) => b.length - a.length)[0];
  if (!coincidencia) return true;
  const visibles = new Set(permisos!.filter((p) => p.ver).map((p) => p.modulo));
  return visibles.has(MODULO_POR_RUTA[coincidencia]);
};

export const accesoOptions = [
  { value: 'Administrador', label: 'Administrador' },
  { value: 'Cajero', label: 'Cajero' },
  { value: 'Auditor', label: 'Auditor' },
];

export const estadoOptions = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
];
