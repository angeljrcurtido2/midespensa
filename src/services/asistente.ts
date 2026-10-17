import api from '../lib/axiosConfig';
import { actualizarCreditosIA, type SaldoCreditosIA } from './creditosIA';

export interface MensajeAsistente {
  rol: 'usuario' | 'asistente';
  texto: string;
}

export interface PresentacionCatalogo {
  descripcion: string;
  unidades: number | null;
  tipo: string;
  sitio: string;
  url: string;
  /** true si el título del catálogo corresponde al mismo producto (marca + concentración). */
  mismo_producto?: boolean;
}

export interface RecomendacionProducto {
  identificado: boolean;
  mensaje?: string;
  producto?: {
    nombre: string;
    marca: string | null;
    principio_activo: string | null;
    concentracion: string | null;
    forma: string | null;
    contenido: string | null;
    cod_barra: string | null;
  };
  presentaciones_encontradas?: PresentacionCatalogo[];
  como_cargar?: {
    unidad_medida: 'UNIDAD' | 'CAJA';
    unidades_por_caja: number | null;
    unidades_por_pack: number | null;
    categoria_sugerida: string | null;
    se_vende_por: Array<'caja' | 'blister' | 'unidad'>;
    verificado: boolean;
    explicacion: string;
  };
  alertas?: string[];
  confianza?: 'alta' | 'media' | 'baja';
}

export interface ProductoDelInventario {
  idproducto: number;
  nombre_producto: string;
  cod_barra: string | null;
  stock: number;
  unidad_medida: string;
  precio_venta: number;
  cant_p_caja: number | null;
  cant_p_pack: number | null;
  similitud: number;
}

export interface TarjetaProducto {
  tipo: 'producto';
  datos: RecomendacionProducto;
  coincidencias: ProductoDelInventario[];
}

export interface RespuestaAsistente {
  success: boolean;
  respuesta?: string;
  tarjetas?: TarjetaProducto[];
  error?: string;
  sin_creditos?: boolean;
  creditos_ia?: SaldoCreditosIA;
}

/** Manda la conversación a Tuki (con una foto opcional adjunta al último mensaje). */
export const enviarMensajeAsistente = async (mensajes: MensajeAsistente[], imagenBase64?: string): Promise<RespuestaAsistente> => {
  const { data } = await api.post<RespuestaAsistente>('/voice/asistente/mensaje', { mensajes, imagenBase64: imagenBase64 || undefined }, { timeout: 120000 });
  actualizarCreditosIA(data.creditos_ia);
  return data;
};
