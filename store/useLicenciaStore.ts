import { create } from 'zustand';
import type { EstadoLicencia, MiLicencia } from '../src/services/licencias';

interface DatosBloqueo {
  fecha_vencimiento?: string | null;
  plan?: string | null;
  monto?: number | null;
  mensaje?: string;
  estado?: string;
}

interface LicenciaStore {
  licencia: MiLicencia | null;
  bloqueada: boolean;
  datosBloqueo: DatosBloqueo | null;

  setLicencia: (licencia: MiLicencia | null) => void;
  bloquear: (datos: DatosBloqueo) => void;
  limpiar: () => void;
}

// Estados en los que el sistema deja de operar. 'gracia' NO entra: el cliente
// venció pero sigue dentro de la tolerancia, así que opera con el aviso puesto.
const ESTADOS_BLOQUEANTES: EstadoLicencia[] = ['bloqueada', 'suspendida', 'cancelada', 'sin_licencia'];

// No se persiste en localStorage a propósito: el estado de la licencia lo decide
// el backend en cada request. Si se guardara acá, bastaría con editar el
// localStorage para seguir usando el sistema sin pagar.
export const useLicenciaStore = create<LicenciaStore>((set) => ({
  licencia: null,
  bloqueada: false,
  datosBloqueo: null,

  setLicencia: (licencia) =>
    set({
      licencia,
      bloqueada: licencia ? ESTADOS_BLOQUEANTES.includes(licencia.estado_efectivo) : false,
      datosBloqueo: licencia && ESTADOS_BLOQUEANTES.includes(licencia.estado_efectivo)
        ? {
            fecha_vencimiento: licencia.fecha_vencimiento,
            plan: licencia.plan_nombre,
            monto: licencia.precio_mensual,
            mensaje: licencia.mensaje,
            estado: licencia.estado_efectivo,
          }
        : null,
    }),

  bloquear: (datos) => set({ bloqueada: true, datosBloqueo: datos }),

  limpiar: () => set({ licencia: null, bloqueada: false, datosBloqueo: null }),
}));
