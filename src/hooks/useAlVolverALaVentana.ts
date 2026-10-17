import { createContext, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTabsStore } from '../../store/useTabsStore';

/** ¿Esta ventana es la que está a la vista? Las demás siguen montadas (con sus datos) pero ocultas. */
export const VentanaActivaContext = createContext(true);
/** Ruta de la ventana (pestaña) en la que está montado el componente. */
export const VentanaRutaContext = createContext<string | null>(null);

/** Ejecuta `alvolver` cada vez que la ventana pasa a estar a la vista (no al montarse), para refrescar sus datos. */
export function useAlVolverALaVentana(alvolver: () => void) {
  const activa = useContext(VentanaActivaContext);
  const antes = useRef(activa);
  useEffect(() => {
    if (activa && !antes.current) alvolver();
    antes.current = activa;
  }, [activa]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Cierra la ventana actual (su pestaña) y vuelve a `destino` (normalmente el listado desde el que se abrió). */
export function useCerrarVentana() {
  const ruta = useContext(VentanaRutaContext);
  const navigate = useNavigate();
  const cerrar = useTabsStore((s) => s.cerrar);
  return (destino: string) => {
    if (ruta) cerrar(ruta);
    navigate(destino);
  };
}
