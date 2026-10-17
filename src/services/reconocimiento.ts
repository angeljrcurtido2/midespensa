import api from '../lib/axiosConfig';
import { actualizarCreditosIA, type SaldoCreditosIA } from './creditosIA';

export interface ProductoReconocido {
  idproducto: number;
  nombre_producto: string;
  cod_barra: string;
  precio_venta: number;
  stock: number;
  estado: string;
  unidad_medida: string;
  nombre_categoria: string;
  similitud: number;
}

export interface ReconocimientoResponse {
  success: boolean;
  productoReconocido: string | null;
  mensaje?: string;
  productos: ProductoReconocido[];
  error?: string;
}

export const reconocerProducto = async (imageBase64: string): Promise<ReconocimientoResponse> => {
  const response = await api.post<ReconocimientoResponse>('/voice/reconocer-producto', {
    imageBase64,
  });
  return response.data;
};

export interface ProductoSugerido {
  idproducto: number;
  nombre_producto: string;
  cod_barra: string | null;
  precio_compra: number | string;
  precio_venta: number | string;
  stock: number;
  unidad_medida: string;
  iva: number | string;
  similitud: number;
  // Presentes solo si el producto ya está cargado como CAJA en el inventario.
  cant_p_caja: number | string | null;
  precio_compra_caja: number | string | null;
  precio_venta_caja: number | string | null;
}

export interface ItemFacturaExtraido {
  descripcion_factura: string;
  cantidad: number | null;
  precio_unitario: number | null;
  // Lo que la IA leyó en el renglón de la factura sobre si es venta por caja.
  // Es una sugerencia editable, no un dato confirmado.
  es_caja_factura: boolean;
  unidades_por_caja_factura: number | null;
  producto_sugerido: ProductoSugerido | null;
  alternativas: Array<{ idproducto: number; nombre_producto: string; similitud: number }>;
  es_producto_nuevo: boolean;
}

export interface FacturaExtraidaResponse {
  success: boolean;
  factura: {
    proveedor_nombre: string | null;
    proveedor_ruc: string | null;
    nro_factura: string | null;
    fecha: string | null;
  };
  proveedor_sugerido: { idproveedor: number; nombre: string; ruc: string | null } | null;
  items: ItemFacturaExtraido[];
  error?: string;
  creditos_ia?: SaldoCreditosIA;
}

export const extraerFactura = async (imageBase64: string): Promise<FacturaExtraidaResponse> => {
  const response = await api.post<FacturaExtraidaResponse>('/voice/factura-extraer', {
    imageBase64,
  });
  actualizarCreditosIA(response.data.creditos_ia);
  return response.data;
};

export interface ProductoDetectado {
  nombre_producto: string | null;
  marca: string | null;
  contenido_neto: string | null;
  categoria_sugerida: string | null;
  unidad_medida_sugerida: 'UNIDAD' | 'CAJA';
  unidades_por_presentacion: number | null;
  /** Unidades de un pack/blíster dentro de la caja (lo propone el asistente Tuki). */
  unidades_por_pack?: number | null;
  /** Los propone el asistente Tuki; el formulario los usa para precargar. */
  principio_activo?: string | null;
  laboratorio?: string | null;
  fuente_presentacion: 'imagen' | 'web' | null;
  cod_barra: string | null;
}

/**
 * Los productos nuevos ya no se cargan como «Caja»: lo que viene en caja o blíster se carga como UNIDAD con un
 * Pack. Si el reconocimiento propone caja, las unidades de la caja (o las del blíster, si lo hay) pasan a ser el pack.
 */
export const normalizarAPack = (p: ProductoDetectado): ProductoDetectado => {
  if (p.unidad_medida_sugerida !== 'CAJA') return p;
  return {
    ...p,
    unidad_medida_sugerida: 'UNIDAD',
    unidades_por_pack: p.unidades_por_pack || p.unidades_por_presentacion || null,
    unidades_por_presentacion: null,
  };
};

export interface ProductoCoincidente {
  idproducto: number;
  nombre_producto: string;
  cod_barra: string | null;
  precio_compra: number | string;
  precio_venta: number | string;
  stock: number;
  unidad_medida: string;
  iva: number | string;
  cant_p_caja: number | string | null;
  precio_compra_caja: number | string | null;
  precio_venta_caja: number | string | null;
  nombre_categoria: string | null;
  similitud: number;
}

export interface ProductoDetalladoResponse {
  success: boolean;
  producto: ProductoDetectado | null;
  mensaje?: string;
  productosCoincidentes: ProductoCoincidente[];
  error?: string;
  creditos_ia?: SaldoCreditosIA;
}

// Reconocimiento detallado por foto: marca, contenido neto, si se vende por
// caja (confirmado con búsqueda web cuando la foto no alcanza), y match
// contra el inventario del tenant. Puede tardar unos segundos más que otros
// endpoints de IA si el modelo necesita buscar en internet.
export const reconocerProductoDetallado = async (imageBase64: string): Promise<ProductoDetalladoResponse> => {
  const response = await api.post<ProductoDetalladoResponse>('/voice/reconocer-producto-detallado', {
    imageBase64,
  });
  actualizarCreditosIA(response.data.creditos_ia);
  return response.data;
};
