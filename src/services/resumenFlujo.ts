import api from '../lib/axiosConfig';

export interface FiltrosFlujo {
  fechaDesde?: string;
  fechaHasta?: string;
  /** Tipos de ingreso que el usuario apagó; no suman al total. */
  tiposIngresoExcluidos?: number[];
  tiposEgresoExcluidos?: number[];
  agrupacion?: 'dia' | 'mes';
  /** Suma al ingreso el fondo con el que se abre cada caja (apagado por defecto). */
  incluirApertura?: boolean;
}

export interface TotalesFlujo {
  totalIngresos: number;
  totalEgresos: number;
  neto: number;
  cantIngresos: number;
  cantEgresos: number;
}

export interface CategoriaFlujo {
  idtipo: number;
  descripcion: string;
  cantidad: number;
  total: number;
  /** Aparece en la lista pero está fuera del total, por decisión del usuario. */
  excluido: boolean;
}

export interface PuntoSerie {
  periodo: string;
  ingresos: number;
  egresos: number;
  neto: number;
}

export interface ResumenFlujoResponse {
  totales: TotalesFlujo;
  desglose: { ingresos: CategoriaFlujo[]; egresos: CategoriaFlujo[] };
  agrupacion: 'dia' | 'mes';
  serie: PuntoSerie[];
}

export interface MovimientoDetalle {
  movimiento: 'ingreso' | 'egreso';
  id: number;
  fecha: string;
  hora: string | null;
  monto: number;
  concepto: string | null;
  categoria: string;
  observacion: string | null;
  /** Generado por una venta o compra, no cargado a mano. */
  automatico: boolean;
  creador: string | null;
}

// Las listas de exclusión viajan como CSV: es lo que el backend parsea y evita
// que axios las serialice como `tipos[]=1&tipos[]=2`.
const serializar = (filtros: FiltrosFlujo) => ({
  fechaDesde: filtros.fechaDesde || undefined,
  fechaHasta: filtros.fechaHasta || undefined,
  tiposIngresoExcluidos: filtros.tiposIngresoExcluidos?.length
    ? filtros.tiposIngresoExcluidos.join(',')
    : undefined,
  tiposEgresoExcluidos: filtros.tiposEgresoExcluidos?.length
    ? filtros.tiposEgresoExcluidos.join(',')
    : undefined,
  agrupacion: filtros.agrupacion,
  incluirApertura: filtros.incluirApertura ? '1' : undefined,
});

export const getResumenFlujo = (filtros: FiltrosFlujo) =>
  api.get<ResumenFlujoResponse>('/resumen-flujo', { params: serializar(filtros) });

export const getDetalleFlujo = (
  filtros: FiltrosFlujo & { page: number; limit: number; search?: string }
) =>
  api.get<{
    data: MovimientoDetalle[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }>('/resumen-flujo/detalle', {
    params: {
      ...serializar(filtros),
      page: filtros.page,
      limit: filtros.limit,
      search: filtros.search || undefined,
    },
  });
