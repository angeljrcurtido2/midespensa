import api from '../lib/axiosConfig';

export type CuadreCaja = 'abierta' | 'cuadra' | 'sobrante' | 'faltante' | 'sin_arqueo';

export interface CajaListado {
  idmovimiento: number;
  num_caja: number;
  estado: 'abierto' | 'cerrado';
  responsable: string;
  rol: string;
  fecha_apertura: string;
  fecha_cierre: string | null;
  monto_apertura: number;
  ingresos: number;
  egresos: number;
  ventas: number;
  ventas_contado: number;
  cobros: number;
  compras: number;
  /** Cobrado menos pagado por transferencia, tarjeta o cheque: no está en el cajón y no entra en el cuadre. */
  otros_medios: number;
  /** false = caja cerrada antes del cuadre en efectivo (se cerró contando todos los medios). */
  cuadre_en_efectivo: boolean;
  /** Efectivo que debería haber: apertura + ingresos en efectivo − egresos en efectivo (al cierre queda fijo). */
  saldo: number;
  /** Total contado en el arqueo al cerrar; null si no hubo arqueo. */
  contado_arqueo: number | null;
  /** contado − saldo: positivo = sobrante (a favor), negativo = faltante. */
  diferencia: number | null;
  cuadre: CuadreCaja;
  modificada_tras_cierre: boolean;
}

export interface ResumenCajas {
  ingresos: number;
  egresos: number;
  diferencia_neta: number;
  cuadran: number;
  no_cuadran: number;
  sin_arqueo: number;
  abiertas: number;
}

export interface RespuestaCajas {
  data: CajaListado[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  resumen: ResumenCajas;
}

export interface FiltrosCajas {
  page?: number;
  limit?: number;
  estado?: '' | 'abierta' | 'cerrada';
  cuadre?: '' | 'cuadra' | 'no_cuadra' | 'sobrante' | 'faltante' | 'sin_arqueo';
  responsable?: string;
  desde?: string;
  hasta?: string;
  buscar?: string;
}

export const getCajas = (filtros: FiltrosCajas) => {
  const params: Record<string, any> = {};
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params[k] = v;
  });
  return api.get<RespuestaCajas>('/movimientos/cajas', { params });
};

export const getResponsablesCajas = () => api.get<{ clave: string; nombre: string }[]>('/movimientos/cajas/responsables');
