import api from '../lib/axiosConfig';

export const createClient = (data: any) => {
  return api.post('/clientes', data);
};

export const getClientById = (id: number | string) => {
  return api.get(`/clientes/${id}`);
};

export const updateClient = (id: number | string, data: any) => {
  return api.put(`/clientes/${id}`, data);
};

// Obtener datos del reporte de clientes (sin PDF)
export const getReportListClient = (search?: string) => {
  return api.get('/clientes/reporte/data', {
    params: search ? { search } : undefined,
  });
};

// Generar PDF del reporte de clientes
export const getReportClientesPDF = (search?: string, tipoCliente?: string) => {
  const params: any = {};

  if (search) {
    params.search = search;
  }

  if (tipoCliente && tipoCliente !== 'todos') {
    params.tipo_cliente = tipoCliente;
  }

  return api.get('/clientes/reporte/pdf', {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
};

export const getClientPaginated = (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  return api.get('/clientes', { params });
};

export const deleteClient = (id: number) => {
  return api.delete(`/clientes/${id}`);
};