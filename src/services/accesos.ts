import api from '../lib/axiosConfig';

/**
 * Accesos por módulo, límites operativos y alta unificada.
 *
 * Reemplaza al control por rol entero: antes tener el rol "Cajero" daba acceso
 * a todo Finanzas —ventas, compras, cobros y caja— sin poder separarlos.
 */

export type AccionPermiso = 'ver' | 'crear' | 'editar' | 'anular';

export type RolFuncionario =
  | 'Cajero'
  | 'Vendedor'
  | 'Auditor'
  | 'Almacenero'
  | 'Supervisor'
  | 'Gerente'
  | 'Personalizado';

export interface ModuloCatalogo {
  clave: string;
  nombre: string;
  grupo: string;
  descripcion: string;
}

export interface PermisoModulo {
  modulo: string;
  nombre?: string;
  grupo?: string;
  descripcion?: string;
  ver: boolean;
  crear: boolean;
  editar: boolean;
  anular: boolean;
}

export interface LimitesOperativos {
  monto_max_venta: number | null;
  descuento_max_pct: number | null;
  puede_vender_credito: boolean | number;
  puede_anular_venta: boolean | number;
  puede_abrir_caja: boolean | number;
  requiere_autorizacion: boolean | number;
}

export interface RolCatalogo {
  rol: RolFuncionario;
  permisos: { modulo: string; ver: number; crear: number; editar: number; anular: number }[];
  limites: LimitesOperativos | null;
  modulosHabilitados: number;
}

export interface CatalogoAccesos {
  modulos: ModuloCatalogo[];
  acciones: AccionPermiso[];
  roles: RolCatalogo[];
}

/** Lo que el usuario logueado puede hacer; alimenta el menú lateral. */
export interface MisPermisos {
  esAdministrador: boolean;
  permisos: PermisoModulo[];
  limites: LimitesOperativos | null;
}

export interface AltaCompletaPayload {
  // Persona
  nombre: string;
  apellido: string;
  cedula?: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  fecha_ingreso?: string;
  // Nómina
  crear_empleado?: boolean;
  tipo_remuneracion?: string;
  aporta_ips?: boolean;
  porcentaje_ips_empleado?: number;
  porcentaje_ips_empleador?: number;
  salario_base?: number;
  modalidad?: string;
  jornada_horas?: number;
  dias_mes?: number;
  // Acceso
  crear_acceso?: boolean;
  login?: string;
  password?: string;
  tipo_funcionario?: RolFuncionario;
  permisos?: { modulo: string; ver: boolean; crear: boolean; editar: boolean; anular: boolean }[];
  limites?: Partial<LimitesOperativos>;
}

export const getCatalogoAccesos = () =>
  api.get<{ success: boolean; data: CatalogoAccesos }>('/accesos/catalogo');

export const getMisPermisos = () =>
  api.get<{ success: boolean; data: MisPermisos }>('/accesos/mis-permisos');

export const getAccesosFuncionario = (idfuncionario: number | string) =>
  api.get<{ success: boolean; data: { permisos: PermisoModulo[]; limites: LimitesOperativos | null } }>(
    `/accesos/${idfuncionario}`,
  );

export const guardarAccesos = (
  idfuncionario: number | string,
  data: {
    permisos: { modulo: string; ver: boolean; crear: boolean; editar: boolean; anular: boolean }[];
    limites: Partial<LimitesOperativos>;
  },
) => api.put(`/accesos/${idfuncionario}`, data);

export const aplicarRol = (idfuncionario: number | string, rol: RolFuncionario) =>
  api.post(`/accesos/${idfuncionario}/aplicar-rol`, { rol });

/** Crea legajo + acceso + permisos en una sola operación transaccional. */
export const altaCompleta = (data: AltaCompletaPayload) =>
  api.post<{ success: boolean; message: string; data: { idempleado: number | null; idfuncionario: number | null } }>(
    '/accesos/alta-completa',
    data,
  );

/** Asocia un funcionario ya existente con su legajo (o lo desvincula con null). */
export const vincularEmpleado = (idfuncionario: number | string, idempleado: number | null) =>
  api.post('/accesos/vincular', { idfuncionario, idempleado });
