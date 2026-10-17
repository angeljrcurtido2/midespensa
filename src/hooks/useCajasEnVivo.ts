import { useCallback, useEffect, useRef, useState } from 'react';
import { getCajasEnVivo, urlWebSocket, type EventoActividad, type SnapshotCajas } from '../services/cajasEnVivo';

export type EstadoConexion = 'conectando' | 'en_vivo' | 'reconectando' | 'sin_permiso';

/**
 * Cajas de los funcionarios en tiempo real: carga la instantánea, abre un WebSocket y
 * la vuelve a pedir cada vez que el servidor avisa que hubo actividad. Si el socket se
 * cae (celular sin señal, túnel, reinicio del servidor) reintenta solo y mientras tanto
 * consulta cada 20 s, así la pantalla nunca queda congelada sin avisar.
 */
export const useCajasEnVivo = () => {
  const [datos, setDatos] = useState<SnapshotCajas | null>(null);
  const [error, setError] = useState('');
  const [conexion, setConexion] = useState<EstadoConexion>('conectando');
  const [eventos, setEventos] = useState<EventoActividad[]>([]);
  const [resaltadas, setResaltadas] = useState<Record<string, number>>({});
  const cargando = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cargar = useCallback(async () => {
    try {
      setDatos(await getCajasEnVivo());
      setError('');
    } catch (e: any) {
      if (e?.response?.status === 403) {
        setConexion('sin_permiso');
        setError(e.response.data?.error || 'Solo el titular de la cuenta puede ver las cajas en vivo.');
      } else {
        setError(e?.response?.data?.error || 'No se pudo actualizar. Reintentando…');
      }
    }
  }, []);

  // Varios eventos seguidos (una venta genera varios) = una sola recarga.
  const recargarPronto = useCallback(() => {
    if (cargando.current) clearTimeout(cargando.current);
    cargando.current = setTimeout(cargar, 350);
  }, [cargar]);

  useEffect(() => {
    let cerrado = false;
    let ws: WebSocket | null = null;
    let reintento: ReturnType<typeof setTimeout> | null = null;
    let intentos = 0;

    const conectar = () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      ws = new WebSocket(urlWebSocket());
      ws.onopen = () => ws?.send(JSON.stringify({ type: 'auth', token }));
      ws.onmessage = (m) => {
        const msg = JSON.parse(m.data);
        if (msg.type === 'ready') {
          intentos = 0;
          setConexion('en_vivo');
          void cargar();
        } else if (msg.type === 'actividad') {
          setEventos((prev) => [msg as EventoActividad, ...prev].slice(0, 30));
          recargarPronto();
        } else if (msg.type === 'error') {
          setError(msg.error);
        }
      };
      ws.onclose = (e) => {
        if (cerrado) return;
        if (e.code === 4403) return setConexion('sin_permiso');
        setConexion('reconectando');
        intentos += 1;
        reintento = setTimeout(conectar, Math.min(1000 * 2 ** intentos, 15000));
      };
    };

    void cargar();
    conectar();
    const respaldo = setInterval(cargar, 20000);

    return () => {
      cerrado = true;
      clearInterval(respaldo);
      if (reintento) clearTimeout(reintento);
      if (cargando.current) clearTimeout(cargando.current);
      ws?.close();
    };
  }, [cargar, recargarPronto]);

  // Marca unos segundos las cajas cuyo saldo/movimientos cambiaron para que se note qué se movió.
  const previo = useRef<Record<number, number>>({});
  useEffect(() => {
    if (!datos) return;
    const cambios: Record<string, number> = {};
    datos.cajas.forEach((c) => {
      const firma = c.cant_movimientos * 1_000_000 + c.saldo;
      if (previo.current[c.idmovimiento] !== undefined && previo.current[c.idmovimiento] !== firma) {
        cambios[c.idmovimiento] = Date.now();
      }
      previo.current[c.idmovimiento] = firma;
    });
    if (Object.keys(cambios).length) {
      setResaltadas((r) => ({ ...r, ...cambios }));
      setTimeout(() => setResaltadas((r) => {
        const n = { ...r };
        Object.keys(cambios).forEach((k) => { if (n[k] === cambios[k]) delete n[k]; });
        return n;
      }), 4000);
    }
  }, [datos]);

  return { datos, error, conexion, eventos, resaltadas, recargar: cargar };
};
