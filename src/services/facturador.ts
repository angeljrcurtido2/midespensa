import api from '../lib/axiosConfig';

//   Obtener lista paginada de facturadores
export const fetchAllFacturadores = (page: number, limit: number, search: string) => {
  return api.get('/facturador', {
    params: { page, limit, search },
  });
};

//   Eliminar un facturador por ID
export const deleteFacturador = (id: number) => {
  return api.delete(`/facturador/${id}`);
};

//   Culminar un facturador por ID
export const culminarFacturador = (id: number) => {
  return api.put(`/facturador/culminar/${id}`);
};

//   Obtener lista paginada de actividades económicas
export const fetchActividadesEconomicas = (page: number, limit: number, search: string) => {
  return api.get('/actividades-economicas', {
    params: { page, limit, search },
  });
};

//   Eliminar una actividad económica por ID
export const deleteActividadEconomica = (id: number) => {
  return api.delete(`/actividades-economicas/${id}`);
};

//   Obtener facturador por ID
export const getFacturadorById = (id: number | string) => {
  return api.get(`/facturador/${id}`);
};

//   Actualizar facturador por ID
export const updateFacturador = (id: number | string, payload: any) => {
  return api.put(`/facturador/${id}`, payload);
};

//   Obtener actividad económica por ID
export const getActividadEconomicaById = (id: number | string) => {
  return api.get(`/actividades-economicas/${id}`);
};

//   Actualizar actividad económica por ID
export const updateActividadEconomica = (id: number | string, data: any) => {
  return api.put(`/actividades-economicas/${id}`, data);
};

export const createFacturador = (payload: any) => {
  return api.post('/facturador', payload);
};

export const createActividadEconomica = (data: any) => {
  return api.post('/actividades-economicas', data);
};

// Obtener datos del reporte de facturadores (sin PDF)
export const getReportListFacturador = (search?: string, estado?: string) => {
  const params: any = {};

  if (search) {
    params.search = search;
  }

  if (estado && estado !== 'todos') {
    params.estado = estado;
  }

  return api.get('/facturador/reporte/data', {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
};

// Generar PDF del reporte de facturadores
export const getReportFacturadoresPDF = (search?: string, estado?: string) => {
  const params: any = {};

  if (search) {
    params.search = search;
  }

  if (estado && estado !== 'todos') {
    params.estado = estado;
  }

  return api.get('/facturador/reporte/pdf', {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
};

export const usuarioTieneFacturadorActivo = async () => {
  // Endpoint liviano abierto a quien vende o compra: el listado completo exige permiso de Configuración
  // y un cajero recibía 403, por lo que no podía registrar ninguna venta.
  const res = await api.get('/facturador/activo');
  return res.data?.activo === true;
};
