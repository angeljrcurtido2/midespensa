import api from '../lib/axiosConfig';

export interface PlantillaFlyer { id: string; nombre: string; descripcion: string }
export interface FormatoFlyer { id: string; nombre: string; ancho: number; alto: number }

export interface OpcionesFlyer {
  idproducto?: number;
  muestra?: boolean;
  plantilla: string;
  formato: string;
  precio_oferta?: number | string;
  descuento?: number | string;
  titulo?: string;
  vigencia?: string;
  telefono?: string;
  mostrar_empresa?: boolean;
  /** Muestra el logo de la empresa (por defecto sí). */
  mostrar_logo?: boolean;
  /** Logo sobre una pastilla blanca (por defecto sí). */
  logo_pastilla?: 'auto' | 'blanca' | 'oscura' | 'ninguna' | 'si' | 'no';
  /** Vuelve transparente el fondo blanco de la foto del producto. */
  quitar_fondo?: boolean;
  /** Qué tan parecido al fondo cuenta como fondo (10–80). */
  tolerancia?: number;
  /** Piezas que el usuario movió o agrandó (dx/dy en píxeles del flyer y s = escala). */
  layout?: LayoutFlyer;
  /** Forma de la pastilla del logo. */
  logo_forma?: FormaLogo;
  /** Color de fondo del logo (#rrggbb); si se indica, reemplaza al fondo automático. */
  logo_color?: string;
  /** El logo llena la forma (recortado); solo con logos casi cuadrados. */
  logo_relleno?: boolean;
  /** El logo va debajo de las piezas del diseño (foto, textos…). */
  logo_atras?: boolean;
  /** También quita el blanco de adentro del logo (el hueco de la «o», la «a»…). */
  logo_huecos?: boolean;
  /** Textos y formas agregados por el usuario. */
  extras?: ExtraFlyer[];
}

export type FormaLogo = 'redondeado' | 'redondo' | 'cuadrado' | 'rectangulo';
export type FormaExtra = 'rect' | 'redondeado' | 'circulo' | 'triangulo' | 'estrella' | 'linea';
export type FuenteExtra = 'sans' | 'serif' | 'cursiva' | 'impacto';
/** x = centro / ancho del flyer, y = centro / alto; w, h y tam son fracciones del ancho. */
export interface ExtraTexto { atras?: boolean; id: string; tipo: 'texto'; texto: string; x: number; y: number; tam: number; color: string; fondo: string | null; negrita: boolean; fuente: FuenteExtra }
export interface ExtraForma { atras?: boolean; id: string; tipo: 'forma'; forma: FormaExtra; x: number; y: number; w: number; h: number; color: string; opacidad: number }
export type ExtraFlyer = ExtraTexto | ExtraForma;

export type PiezaFlyer = 'foto' | 'titulo' | 'nombre' | 'precio' | 'descuento' | 'contacto' | 'logo';
export interface AjustePieza { dx: number; dy: number; s: number }
export type LayoutFlyer = Partial<Record<PiezaFlyer, AjustePieza>>;
export interface CajaPieza { x: number; y: number; w: number; h: number }

export interface FlyerEditable {
  base64: string;
  ancho: number;
  alto: number;
  elementos: Record<string, CajaPieza>;
  layout: LayoutFlyer;
  avisos: string[];
}

export const getPlantillasFlyer = () => api.get<{ plantillas: PlantillaFlyer[]; formatos: FormatoFlyer[] }>('/publicidad/plantillas');

/** El flyer ya armado (PNG). */
export const generarFlyer = (opciones: OpcionesFlyer) =>
  api.post<Blob>('/publicidad/flyer', opciones, { responseType: 'blob' });

/** El flyer en base64 más el rectángulo de cada pieza: lo usa el editor para mover y agrandar las piezas. */
export const generarFlyerEditable = (opciones: OpcionesFlyer) =>
  api.post<FlyerEditable>('/publicidad/flyer', opciones, { params: { elementos: 1 } });
