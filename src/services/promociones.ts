import api from '../lib/axiosConfig';

export type EstadoPromo = 'vigente' | 'programada' | 'vencida' | 'inactiva' | 'sin_promo';

export interface ProductoPromo {
  idproducto: number;
  nombre_producto: string;
  unidad_medida: string;
  imagen: string | null;
  cant_p_caja: number | null;
  cant_p_pack: number | null;
  idcategoria: number | null;
  categoria: string | null;
  precio_venta: string | number;
  precio_venta_caja: string | number | null;
  precio_venta_pack: string | number | null;
  precio_promo: string | number | null;
  precio_promo_caja: string | number | null;
  precio_promo_pack: string | number | null;
  promo_desde: string | null;
  promo_hasta: string | null;
  promo_activa: number;
  promo_titulo: string | null;
  estado_promo: EstadoPromo;
}

export interface ListadoPromos {
  data: ProductoPromo[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  resumen: Record<EstadoPromo, number>;
}

export const getPromociones = (params: { page: number; limit: number; search?: string; estado?: string; idcategoria?: number }) =>
  api.get<ListadoPromos>('/promociones', { params });

export interface DatosPromo {
  precio_promo?: number | string | null;
  precio_promo_caja?: number | string | null;
  precio_promo_pack?: number | string | null;
  promo_desde?: string | null;
  promo_hasta?: string | null;
  promo_activa?: boolean;
  promo_titulo?: string | null;
}

export const guardarPromocion = (id: number, datos: DatosPromo) => api.put(`/promociones/${id}`, datos);
export const quitarPromocion = (id: number) => api.delete(`/promociones/${id}`);
export const aplicarPromocionMasiva = (datos: { ids?: number[]; idcategoria?: number; porcentaje: number; promo_desde?: string | null; promo_hasta?: string | null; promo_titulo?: string | null }) =>
  api.post<{ message: string; actualizados: number }>('/promociones/masiva', datos);
export const limpiarPromociones = (datos: { ids?: number[]; estado?: 'vencida' | 'inactiva' | 'todas' }) =>
  api.post<{ message: string; quitadas: number }>('/promociones/limpiar', datos);
