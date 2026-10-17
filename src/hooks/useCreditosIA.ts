import { useEffect, useSyncExternalStore } from 'react';
import {
  CREDITOS_POR_TIPO,
  cargarCreditosIA,
  leerCreditosIA,
  suscribirCreditosIA,
  type TipoCreditoIA,
} from '../services/creditosIA';

// Saldo de créditos IA del mes. Lo carga una vez al montar y después se
// actualiza solo con cada respuesta de la IA (ver actualizarCreditosIA).
export const useCreditosIA = (tipo: TipoCreditoIA) => {
  const saldo = useSyncExternalStore(suscribirCreditosIA, leerCreditosIA);

  useEffect(() => {
    cargarCreditosIA();
  }, []);

  const costo = CREDITOS_POR_TIPO[tipo];
  // Mientras no se conoce el saldo se permite usar: el backend valida igual.
  const alcanza = saldo ? saldo.disponibles >= costo : true;

  return { saldo, costo, alcanza };
};
