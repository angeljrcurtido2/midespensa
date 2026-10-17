import api from '../lib/axiosConfig';

export const listarArqueosPaginado = (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  return api.get('/arqueo/listar/paginado', { params });
};

export const getArqueoFindByMovement = (idmovimiento: number) => {
  return api.get(`/arqueo/movimiento/${idmovimiento}`);
};
