import api from '../lib/axiosConfig';

export const getProveedoresPaginated = (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  return api.get('/proveedores', { params });
};

export const deleteProveedor = (id: number) => {
  return api.delete(`/proveedores/${id}`);
};

export const getProveedorById = (id: number | string) => {
  return api.get(`/proveedores/${id}`);
};

export const updateProveedor = (id: number | string, data: any) => {
  return api.put(`/proveedores/${id}`, data);
};

export const createProveedor = (data: any) => {
  return api.post('/proveedores', data);
};

// Obtener datos del reporte de proveedores (sin PDF)
export const getReportListProvider = (search?: string) => {
  return api.get('/proveedores/reporte/data', {
    params: search ? { search } : undefined,
  });
};

// Generar PDF del reporte de proveedores
export const getReportProveedoresPDF = (search?: string) => {
  const params: any = {};

  if (search) {
    params.search = search;
  }

  return api.get('/proveedores/reporte/pdf', {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
};