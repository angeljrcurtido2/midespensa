import api from '../lib/axiosConfig';

export interface LoteAlertaVencimiento {
  idproducto: number;
  nombre_producto: string;
  cod_barra: string | null;
  principio_activo: string | null;
  receta: string | null;
  unidad_medida: string;
  idlote: number;
  numero_lote: string;
  /** YYYY-MM-DD */
  fecha_vencimiento: string;
  stock_actual: number;
  /** Días hasta el vencimiento; negativo = ya venció. */
  dias: number;
}

export interface ProductoAlertaReposicion {
  idproducto: number;
  nombre_producto: string;
  cod_barra: string | null;
  principio_activo: string | null;
  unidad_medida: string;
  cant_p_caja: number | null;
  stock: number;
  stock_minimo: number;
  faltan: number;
  agotado: boolean;
}

export interface ResumenAlertas {
  vencidos: number;
  por_vencer_30: number;
  por_vencer_90: number;
  reposicion: number;
  agotados: number;
}

export const getAlertasVencimientos = (dias: number) =>
  api.get<{ success: boolean; dias: number; vencidos: number; data: LoteAlertaVencimiento[] }>('/productos/alertas/vencimientos', { params: { dias } });

export const getAlertasReposicion = () =>
  api.get<{ success: boolean; data: ProductoAlertaReposicion[] }>('/productos/alertas/reposicion');

export const getResumenAlertas = () => api.get<ResumenAlertas & { success: boolean }>('/productos/alertas/resumen');
