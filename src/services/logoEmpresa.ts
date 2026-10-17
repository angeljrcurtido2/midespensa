import api from '../lib/axiosConfig';

export interface LogoEmpresa {
  tiene: boolean;
  url?: string;
  urlMono?: string;
  ancho?: number;
  alto?: number;
  /** Solo al subir: el servidor volvió transparente el fondo blanco. */
  fondoQuitado?: boolean;
  avisos?: string[];
}

export type ModoFondo = 'auto' | 'quitar' | 'mantener';

export const getLogoFacturador = (idfacturador: number | string) => api.get<LogoEmpresa>(`/facturador/${idfacturador}/logo`);

/** Sube el logo; el servidor lo estandariza (recorte, tamaño, fondo transparente y versión en blanco y negro). */
export const subirLogoFacturador = (idfacturador: number | string, archivo: File, fondo: ModoFondo = 'auto') => {
  const datos = new FormData();
  datos.append('logo', archivo);
  datos.append('fondo', fondo);
  return api.post<LogoEmpresa>(`/facturador/${idfacturador}/logo`, datos);
};

export const eliminarLogoFacturador = (idfacturador: number | string) => api.delete<LogoEmpresa>(`/facturador/${idfacturador}/logo`);

/** Dirección pública del logo (se entrega desde /uploads/logos). */
export const urlLogo = (ruta?: string) => {
  if (!ruta) return '';
  const base = String(api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${base}${ruta}`;
};
