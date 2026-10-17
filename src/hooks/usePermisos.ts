import { useEffect, useState } from 'react';
import { getMisPermisos, type LimitesOperativos, type PermisoModulo } from '../services/accesos';

/**
 * Permisos del usuario logueado, para que cada pantalla muestre sólo lo que
 * la persona puede usar.
 *
 * Esto es presentación, no seguridad: el backend valida igual en cada request.
 * Sirve para no ofrecer botones que van a fallar ni pedir datos que devolverán
 * 403 —el dashboard, por ejemplo, disparaba varias consultas de ventas a un
 * almacenero y llenaba la pantalla de errores rojos.
 *
 * Se consulta una vez por montaje y se cachea en memoria: varias pantallas
 * pueden preguntar sin multiplicar las llamadas.
 */

interface EstadoPermisos {
  cargando: boolean;
  esAdministrador: boolean;
  permisos: PermisoModulo[];
  limites: LimitesOperativos | null;
}

let cache: Omit<EstadoPermisos, 'cargando'> | null = null;
let enVuelo: Promise<void> | null = null;

/** Se llama al cerrar sesión para que el próximo usuario no herede el cache. */
export const limpiarCachePermisos = () => {
  cache = null;
  enVuelo = null;
};

export const usePermisos = () => {
  const [estado, setEstado] = useState<EstadoPermisos>(() =>
    cache ? { ...cache, cargando: false } : {
      cargando: true,
      esAdministrador: false,
      permisos: [],
      limites: null,
    },
  );

  useEffect(() => {
    if (cache) {
      setEstado({ ...cache, cargando: false });
      return;
    }

    let vigente = true;

    const cargar = async () => {
      if (!enVuelo) {
        enVuelo = getMisPermisos()
          .then(({ data }) => {
            cache = {
              esAdministrador: !!data.data?.esAdministrador,
              permisos: data.data?.permisos || [],
              limites: data.data?.limites || null,
            };
          })
          .catch(() => {
            // Ante un error se asume el caso más permisivo para no romper la
            // pantalla: el backend igual rechaza lo que no corresponda.
            cache = { esAdministrador: true, permisos: [], limites: null };
          })
          .finally(() => {
            enVuelo = null;
          });
      }
      await enVuelo;
      if (vigente && cache) setEstado({ ...cache, cargando: false });
    };

    cargar();
    return () => {
      vigente = false;
    };
  }, []);

  /** ¿Puede hacer `accion` en `modulo`? El administrador siempre puede. */
  const puede = (modulo: string, accion: keyof Pick<PermisoModulo, 'ver' | 'crear' | 'editar' | 'anular'> = 'ver') => {
    if (estado.esAdministrador) return true;
    const p = estado.permisos.find((x) => x.modulo === modulo);
    return !!p?.[accion];
  };

  return { ...estado, puede };
};
