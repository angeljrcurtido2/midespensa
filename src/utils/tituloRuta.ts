import { generateNavItems } from './generateNavItems';

/** Títulos de las pantallas que no están en el menú (se abren desde un botón). */
const EXTRAS: Record<string, string> = {
  '/amonestaciones/nuevo': 'Nueva amonestación',
  '/comisiones/nuevo': 'Nueva comisión',
  '/horas-extras/nuevo': 'Nueva hora extra',
  '/salarios/nuevo': 'Nuevo salario',
  '/liquidaciones/nuevo': 'Nueva liquidación',
  '/movimientos-rrhh/nuevo': 'Nuevo movimiento de RR. HH.',
  '/asistencia/nueva': 'Nueva asistencia',
  '/datosbancarios/nuevo': 'Nuevo dato bancario',
  '/accesos/nuevo': 'Nueva persona',
  '/ventas/ventaProgramada/nueva': 'Nueva venta programada',
  '/compras/cobrodeuda/pagar': 'Registrar pago a proveedor',
  '/compras/cobrodeuda': 'Pago compras crédito',
  '/ventas/cobrodeuda': 'Cobro ventas crédito',
  '/movimiento/ingreso/nuevo': 'Nuevo ingreso',
  '/movimiento/egreso/nuevo': 'Nuevo egreso',
  '/movimiento/cierrecaja/apertura/nueva': 'Abrir caja',
  '/movimiento/arqueo': 'Arqueos de caja',
  '/ventas/cobrodeuda/pagar': 'Registrar cobro al cliente',
  '/ventas/nueva': 'Nueva venta',
  '/ventas/reporte': 'Reporte de ventas',
  '/compras/nueva': 'Nueva compra',
  '/compras/factura-ia': 'Cargar factura con IA',
  '/compras/reporte': 'Reporte de compras',
  '/compras/seleccionar-proveedor': 'Seleccionar proveedor',
  '/compras/seleccionar-producto': 'Seleccionar producto',
  '/ventas/seleccionar-producto': 'Seleccionar producto',
  '/clientes/nuevo': 'Nuevo cliente',
  '/proveedor/nuevo': 'Nuevo proveedor',
  '/categoria/nueva': 'Nueva categoria',
  '/facturador/nuevo': 'Nuevo facturador',
  '/empleados/nuevo': 'Nuevo empleado',
  '/usuario/nuevo': 'Nuevo usuario',
  '/funcionarios/nuevo': 'Nuevo funcionario',
  '/productos/nuevo': 'Nuevo producto',
  '/lector-codigo-barra-web': 'Lector de código de barras para web',
  '/proveedor': 'Proveedores',
  '/categoria': 'Categorías',
};

/** Pantallas con identificador en la ruta (ej. /clientes/editar/5). */
const CON_ID: [RegExp, string][] = [
  [/^\/clientes\/editar\/(\d+)$/, 'Editar cliente'],
  [/^\/proveedor\/editar\/(\d+)$/, 'Editar proveedor'],
  [/^\/productos\/editar\/(\d+)$/, 'Editar producto'],
  [/^\/categoria\/editar\/(\d+)$/, 'Editar categoria'],
  [/^\/facturador\/editar\/(\d+)$/, 'Editar facturador'],
  [/^\/empleados\/editar\/(\d+)$/, 'Editar empleado'],
  [/^\/usuario\/editar\/(\d+)$/, 'Editar usuario'],
  [/^\/funcionarios\/editar\/(\d+)$/, 'Editar funcionario'],
  [/^\/amonestaciones\/editar\/(\d+)$/, 'Editar amonestación'],
  [/^\/comisiones\/editar\/(\d+)$/, 'Editar comisión'],
  [/^\/horas-extras\/editar\/(\d+)$/, 'Editar hora extra'],
  [/^\/salarios\/editar\/(\d+)$/, 'Editar salario'],
  [/^\/liquidaciones\/editar\/(\d+)$/, 'Editar liquidación'],
  [/^\/movimientos-rrhh\/editar\/(\d+)$/, 'Editar movimiento de RR. HH.'],
  [/^\/asistencia\/editar\/(\d+)$/, 'Editar asistencia'],
  [/^\/datosbancarios\/editar\/(\d+)$/, 'Editar dato bancario'],
  [/^\/accesos\/gestionar\/(\d+)$/, 'Gestionar accesos'],
  [/^\/compras\/cobrodeuda\/pagar\/(\d+)$/, 'Registrar pago a proveedor'],
  [/^\/compras\/cobrodeuda\/pagos\/(\d+)$/, 'Historial de pagos de compra'],
  [/^\/compras\/detalle\/(\d+)$/, 'Detalle de compra'],
  [/^\/ventas\/cobrodeuda\/cliente\/(\d+)$/, 'Deudas del cliente'],
  [/^\/ventas\/cobrodeuda\/pagar\/(\d+)$/, 'Registrar cobro al cliente'],
  [/^\/ventas\/cobrodeuda\/pagos\/(\d+)$/, 'Historial de pagos de venta'],
  [/^\/ventas\/detalle\/(\d+)$/, 'Detalle de venta'],
  [/^\/movimiento\/cierrecaja\/resumen\/(\d+)$/, 'Resumen de caja'],
  [/^\/movimiento\/cierrecaja\/reportes\/(\d+)$/, 'Reportes de caja'],
];

let cache: Record<string, string> | null = null;

const mapa = (): Record<string, string> => {
  if (cache) return cache;
  const m: Record<string, string> = {};
  for (const item of generateNavItems('Administrador', true, null)) {
    if (item.path) m[item.path] = item.name;
    for (const s of item.subItems ?? []) m[s.path] = s.name;
  }
  cache = { ...m, ...EXTRAS };
  return cache;
};

export const normalizarRuta = (path: string): string => (path || '/').split('?')[0].replace(/\/+$/, '') || '/';

export const tituloDeRuta = (path: string): string => {
  const ruta = normalizarRuta(path);
  const fijo = mapa()[ruta];
  if (fijo) return fijo;
  for (const [patron, titulo] of CON_ID) {
    const m = ruta.match(patron);
    if (m) return `${titulo} #${m[1]}`;
  }
  return 'Pantalla';
};
