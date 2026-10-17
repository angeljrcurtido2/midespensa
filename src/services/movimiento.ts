import api from '../lib/axiosConfig';

export interface MovCajaQuery {
  page:  number;
  limit: number;
  search?:        string;
  aperturaDesde?: string;
  aperturaHasta?: string;
  cierreDesde?:   string;
  cierreHasta?:   string;
}

export const getMovimientosCajaPaginated = (query: MovCajaQuery) =>
  api.get('/movimientos/paginado', { params: query });

export const getCajaAbierta = () =>
  api.get('/movimientos/abierta');

export const getResumenMovimiento = (idmovimiento: number) => {
  return api.get(`/movimientos/resumen/${idmovimiento}`);
};

export const registrarArqueo = (payload: any) => {
  return api.post('/arqueo/registrar', payload);
};

export const cerrarCaja = (idmovimiento: number) => {
  return api.put(`/movimientos/cerrarCaja/${idmovimiento}`);
};

// Generar PDF del Libro de Caja SET
export const generateLibroCajaPDF = (params: {
  fecha_inicio?: string;
  fecha_fin?: string;
}) => {
  return api.get('/movimientos/libro-caja/pdf', { params });
};