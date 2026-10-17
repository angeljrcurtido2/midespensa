import api from '../lib/axiosConfig';

export const getProductosPaginated = (params: {
  page: number;
  limit: number;
  search?: string;
  /** 1 = precios con la promoción vigente (pantallas de venta). */
  para_venta?: 1;
}) => {
  return api.get('/productos', { params });
};

/** Pide al servidor un código de barras EAN-13 interno, libre en la cuenta. `evitar`: códigos ya generados y aún sin guardar. */
export const generarCodigoBarra = (evitar: string[] = []) =>
  api.get('/productos/generar-codigo-barra', { params: evitar.length ? { evitar: evitar.join(',') } : {} });

export const deleteProducto = (id: number) => {
  return api.delete(`/productos/${id}`);
};

export const getProductoById = (id: number | string) => {
  return api.get(`/productos/${id}`);
};

export const getReportProducts = (search?: string) => {
  return api.get('/productos/reporteproductopdf', {
    params: search ? { search } : undefined,
  });
};

export const updateProducto = (id: number | string, data: any) => {
  return api.put(`/productos/${id}`, data);
};

/** Dirección pública de la foto de un producto (el servidor la entrega desde /uploads/productos). */
export const urlImagenProducto = (imagen?: string | null) => {
  if (!imagen) return '';
  const base = String(api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${base}/uploads/productos/${imagen}`;
};

export const subirImagenProducto = (id: number | string, archivo: File) => {
  const datos = new FormData();
  datos.append('imagen', archivo);
  return api.post<{ message: string; imagen: string }>(`/productos/${id}/imagen`, datos);
};

export const eliminarImagenProducto = (id: number | string) => {
  return api.delete(`/productos/${id}/imagen`);
};

/** Ajuste manual del stock (inventario que no cuadra): deja el stock en `stock_nuevo` y registra el motivo. */
export const ajustarStockProducto = (id: number | string, stock_nuevo: number, motivo: string) =>
  api.put(`/productos/${id}/stock`, { stock_nuevo, motivo });

export const historialAjustesStock = (id: number | string) => api.get(`/productos/${id}/stock-ajustes`);
