// services/productoDetalle.ts
import axiosInstance from '../lib/axiosConfig';

export interface DetalleProducto {
  atributo: string;  // 'color', 'sabor', 'tamaño', etc.
  valor: string;     // 'rojo', 'frutilla', 'grande', etc.
  cantidad: number;
}

export interface DetalleProductoResponse extends DetalleProducto {
  iddetalle: number;
  idproducto: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Obtener detalles de un producto
 */
export const getDetalles = async (idproducto: number) => {
  const response = await axiosInstance.get(`/producto-detalle/${idproducto}`);
  return response.data;
};

/**
 * Guardar detalles de un producto (reemplaza los existentes)
 */
export const guardarDetalles = async (idproducto: number, detalles: DetalleProducto[]) => {
  const response = await axiosInstance.post('/producto-detalle', {
    idproducto,
    detalles
  });
  return response.data;
};

/**
 * Eliminar un detalle específico
 */
export const eliminarDetalle = async (iddetalle: number) => {
  const response = await axiosInstance.delete(`/producto-detalle/${iddetalle}`);
  return response.data;
};
