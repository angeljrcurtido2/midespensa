import api from '../lib/axiosConfig';

// Obtener tipos de egreso paginados
export const getTiposEgresoPaginated = (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  return api.get('/tipo-egreso/listar', { params });
};

export const getEgresosPorMovimiento = (idmovimiento: number) => {
  return api.get(`/egresos/${idmovimiento}/egresos`);
};

// Anular tipo de egreso
export const anularTipoEgreso = (id: number) => {
  return api.delete(`/tipo-egreso/anular/${id}`);
};

export const getEgresosPaginated = (params: {
  page: number;
  limit: number;
  search?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}) => api.get('/egresos', { params });

export const deleteEgreso = (id: number) => api.delete(`/egresos/${id}`);

export const crearTipoEgreso = (descripcion: string) => {
  return api.post('/tipo-egreso/crear', { descripcion: descripcion.trim() });
};

export const registrarEgreso = (data: {
  idtipo_egreso: number;
  monto: number;
  concepto: string;
  observacion: string;
  fecha: string;
}) => {
  return api.post('/egresos/registrar', data);
};

