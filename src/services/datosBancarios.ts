import api from '../lib/axiosConfig';

export const getDatosBancariosPaginated = (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  return api.get('/datos-bancarios/paginated', { params });
};

export const createDatosBancarios = (data: any) => {
  return api.post('/datos-bancarios', data);
};

export const deleteDatosBancarios = (id: number) => {
  return api.delete(`/datos-bancarios/${id}`);
};

export const getDatosBancariosById = (id: number | string) => {
  return api.get(`/datos-bancarios/${id}`);
};

export const updateDatosBancarios = (id: number | string, data: any) => {
  return api.put(`/datos-bancarios/${id}`, data);
};
