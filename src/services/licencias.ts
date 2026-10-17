import api from '../lib/axiosConfig';

export type EstadoLicencia =
  | 'activa'
  | 'por_vencer'
  | 'gracia'
  | 'bloqueada'
  | 'suspendida'
  | 'cancelada'
  | 'sin_licencia';

export interface MiLicencia {
  tiene_licencia: boolean;
  idlicencia?: number;
  idusuarios?: number;
  fecha_vencimiento?: string;
  dias_gracia?: number;
  estado?: string;
  estado_efectivo: EstadoLicencia;
  dias_restantes?: number;
  dias_hasta_bloqueo?: number;
  prorroga_hasta?: string | null;
  ia_habilitada?: number;
  /** 0 = se oculta "Lector de código de barras para web" en esta cuenta. */
  lector_barras_web?: number;
  plan_nombre?: string | null;
  precio_mensual?: number | null;
  mensaje?: string;
}

// Estado de la licencia del usuario logueado.
// El backend deja esta ruta exenta del bloqueo, así que responde incluso con la
// licencia vencida: es la que alimenta la pantalla de bloqueo.
export const getMiLicencia = () => api.get<MiLicencia>('/licencias/mi-licencia');

export interface LicenciaAdmin {
  idlicencia: number;
  idusuarios: number;
  idplan: number | null;
  login: string;
  nombre: string;
  apellido: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  dias_gracia: number;
  estado: string;
  estado_efectivo: EstadoLicencia;
  dias_restantes: number;
  dias_hasta_bloqueo?: number;
  prorroga_hasta?: string | null;
  ia_habilitada?: number;
  plan_nombre: string | null;
  precio_mensual: number | null;
}

export interface UsuarioSinLicencia {
  idusuarios: number;
  login: string;
  nombre: string;
  apellido: string;
  telefono?: string | null;
  cedula?: string | null;
  email?: string | null;
  created_at: string;
}

export interface Plan {
  idplan: number;
  nombre: string;
  descripcion: string | null;
  precio_mensual: number;
  max_funcionarios: number | null;
  dias_gracia: number;
}

// Administración (sólo proveedor; el backend lo exige con requireProveedor)
export const getLicencias = () => api.get<LicenciaAdmin[]>('/licencias');
export const getPlanes = () => api.get<Plan[]>('/licencias/planes');
export const getUsuariosSinLicencia = () =>
  api.get<UsuarioSinLicencia[]>('/licencias/sin-licencia');

export const crearLicencia = (data: {
  idusuarios: number;
  idplan?: number | null;
  fecha_inicio: string;
  fecha_vencimiento: string;
  dias_gracia?: number;
  estado?: string;
  notas?: string;
  ia_habilitada?: boolean;
}) => api.post('/licencias', data);

export const actualizarLicencia = (
  idlicencia: number,
  data: {
    idplan?: number | null;
    fecha_vencimiento: string;
    dias_gracia?: number;
    estado?: string;
    notas?: string;
    idusuarios?: number;
    ia_habilitada?: boolean;
  }
) => api.put(`/licencias/${idlicencia}`, data);

export const getPagosLicencia = (idlicencia: number) =>
  api.get(`/licencias/${idlicencia}/pagos`);

// "Marcar como pagado": el período lo calcula el servidor. `monto` es lo realmente recibido.
export const registrarPagoLicencia = (
  idlicencia: number,
  data: {
    monto: number;
    fecha_pago?: string;
    meses?: number;
    medio_pago?: string;
    comprobante?: string;
    observacion?: string;
    /** El cliente podrá descargar el recibo (por defecto sí). */
    autorizar_recibo?: boolean;
  }
) => api.post(`/licencias/${idlicencia}/pagos`, data);

/** Deshace el ÚLTIMO pago: la licencia vuelve al vencimiento que tenía antes. */
export const anularPagoLicencia = (idlicencia: number, idpago: number) =>
  api.delete(`/licencias/${idlicencia}/pagos/${idpago}`);

/** El proveedor habilita (true) o retira (false) el recibo para que lo descargue el cliente. */
export const autorizarReciboLicencia = (idlicencia: number, idpago: number, autorizado: boolean) =>
  api.put(`/licencias/${idlicencia}/pagos/${idpago}/recibo`, { autorizado });

/** Vista previa del recibo para el proveedor (cualquier pago). */
export const getReciboPagoLicencia = (idlicencia: number, idpago: number) =>
  api.get<{ reportePDFBase64: string; nombreArchivo: string }>(`/licencias/${idlicencia}/pagos/${idpago}/recibo`);

export interface MiPagoLicencia {
  idpago: number;
  nro_recibo: string;
  monto: number;
  monto_esperado: number | null;
  meses: number | null;
  fecha_pago: string;
  periodo_desde: string;
  periodo_hasta: string;
  medio_pago: string | null;
  comprobante: string | null;
  recibo_autorizado: boolean;
}

// Cliente (titular): sus pagos y recibos autorizados por el proveedor.
export const getMisPagosLicencia = () => api.get<MiPagoLicencia[]>('/licencias/mis-pagos');
export const getMiReciboLicencia = (idpago: number) =>
  api.get<{ reportePDFBase64: string; nombreArchivo: string }>(`/licencias/mis-pagos/${idpago}/recibo`);

// Prorroga excepcional: "N dias de gracia a partir de hoy" (queda registrada).
export const darProrrogaLicencia = (
  idlicencia: number,
  data: { idusuarios: number; dias: number; motivo: string }
) => api.post(`/licencias/${idlicencia}/prorroga`, data);

export const revocarProrrogaLicencia = (idlicencia: number) =>
  api.delete(`/licencias/${idlicencia}/prorroga`);

export const getProrrogasLicencia = (idlicencia: number) =>
  api.get(`/licencias/${idlicencia}/prorrogas`);

// ───── Cobro por transferencia / QR (sin pasarela): cuentas de cobro y avisos de pago ─────

export interface CuentaCobro {
  idcuenta: number;
  banco: string;
  tipo: 'cuenta' | 'billetera';
  numero_cuenta: string | null;
  titular: string | null;
  documento: string | null;
  alias: string | null;
  nota: string | null;
  orden: number;
  tiene_qr: boolean;
}

export type EstadoAviso = 'pendiente' | 'aprobado' | 'rechazado';

export interface AvisoPago {
  idaviso: number;
  monto: number | string;
  fecha_pago: string;
  medio_pago: 'transferencia' | 'qr' | 'deposito';
  banco: string | null;
  referencia: string | null;
  observacion: string | null;
  estado: EstadoAviso;
  motivo_rechazo: string | null;
  idpago: number | null;
  nro_recibo: string | null;
  tiene_comprobante: boolean;
  created_at: string;
  resuelto_en: string | null;
}

/** Aviso tal como lo ve el proveedor: con los datos del cliente y de su licencia. */
export interface AvisoPagoAdmin extends AvisoPago {
  idusuarios: number;
  idlicencia: number;
  login: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  cedula: string | null;
  email: string | null;
  fecha_vencimiento: string;
  plan_nombre: string | null;
  precio_mensual: number | null;
}

// Cliente: ve las cuentas del proveedor (también con la licencia vencida) y avisa su pago.
export const getCuentasCobro = () => api.get<CuentaCobro[]>('/licencias/cuentas-cobro');
export const getMisAvisosPago = () => api.get<AvisoPago[]>('/licencias/mis-avisos');
export const crearAvisoPago = (datos: FormData) =>
  api.post<{ message: string; idaviso: number }>('/licencias/avisos-pago', datos);

// Los archivos están detrás de la sesión: se piden como blob (no sirven en un <img src> directo).
export const getQrCuentaCobro = (idcuenta: number) =>
  api.get<Blob>(`/licencias/cuentas-cobro/${idcuenta}/qr`, { responseType: 'blob' });
export const getComprobanteAviso = (idaviso: number) =>
  api.get<Blob>(`/licencias/avisos-pago/${idaviso}/comprobante`, { responseType: 'blob' });

// Proveedor: gestión de sus cuentas de cobro y revisión de los avisos.
export const guardarCuentaCobro = (idcuenta: number | null, datos: FormData) =>
  idcuenta ? api.put(`/licencias/cuentas-cobro/${idcuenta}`, datos) : api.post('/licencias/cuentas-cobro', datos);
export const borrarCuentaCobro = (idcuenta: number) => api.delete(`/licencias/cuentas-cobro/${idcuenta}`);
export const getAvisosPago = (estado: EstadoAviso | 'todos' = 'pendiente') =>
  api.get<AvisoPagoAdmin[]>('/licencias/avisos-pago', { params: { estado } });
export const getResumenAvisosPago = () => api.get<{ pendientes: number }>('/licencias/avisos-pago/resumen');
export const aprobarAvisoPago = (idaviso: number, data: { monto?: number; meses?: number; autorizar_recibo?: boolean }) =>
  api.put<{ message: string; nro_recibo: string; vence: string }>(`/licencias/avisos-pago/${idaviso}/aprobar`, data);
export const rechazarAvisoPago = (idaviso: number, motivo: string) =>
  api.put(`/licencias/avisos-pago/${idaviso}/rechazar`, { motivo });
