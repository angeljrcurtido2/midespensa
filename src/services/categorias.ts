import api from '../lib/axiosConfig';

export const createCategory = (data: any) => {
  return api.post('/categorias', data);
};

export const getCategoryById = (id: number | string) => {
  return api.get(`/categorias/${id}`);
};

export const updateCategory = (id: number | string, data: any) => {
  return api.put(`/categorias/${id}`, data);
};

export const getCategoryPaginated = (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  return api.get('/categorias', { params });
};

export const deleteCategory = (id: number) => {
  return api.delete(`/categorias/${id}`);
};