import { useEffect, useRef } from 'react';
import { urlWebSocket } from '../services/cajasEnVivo';

/**
 * Recibe en la web los códigos de barras que se escanean con la cámara del celular (app KontrolX, misma cuenta).
 * Se conecta al canal 'lector-web' del servidor y llama a `alCodigo` con cada lectura.
 *
 * Como las pestañas del espacio de trabajo siguen montadas aunque estén ocultas, `visible` permite que solo reaccione la
 * pantalla que se está viendo: si devuelve false, la lectura se ignora en esa instancia.
 */
export function useLectorCelular(alCodigo: (codigo: string) => void, visible: () => boolean = () => true) {
  const alCodigoRef = useRef(alCodigo);
  const visibleRef = useRef(visible);
  alCodigoRef.current = alCodigo;
  visibleRef.current = visible;
  const ultima = useRef({ valor: '', tiempo: 0 });

  useEffect(() => {
    let activa = true;
    let intento = 0;
    let reintento: ReturnType<typeof setTimeout> | null = null;
    let conexion: WebSocket | null = null;

    const conectar = () => {
      if (!activa) return;
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      try {
        const socket = new WebSocket(urlWebSocket());
        conexion = socket;
        socket.onopen = () => socket.send(JSON.stringify({ type: 'auth', token, canal: 'lector-web' }));
        socket.onmessage = (evento) => {
          let mensaje: any;
          try { mensaje = JSON.parse(String(evento.data)); } catch { return; }
          if (mensaje.type === 'ready') { intento = 0; return; }
          if (mensaje.type !== 'barcode') return;
          const codigo = String(mensaje.codigo || '').trim();
          const ahora = Date.now();
          if (!codigo || (ultima.current.valor === codigo && ahora - ultima.current.tiempo < 1400)) return;
          if (!visibleRef.current()) return;
          ultima.current = { valor: codigo, tiempo: ahora };
          alCodigoRef.current(codigo);
        };
        socket.onclose = () => {
          if (!activa) return;
          intento += 1;
          reintento = setTimeout(conectar, Math.min(1000 * 2 ** intento, 15000));
        };
        socket.onerror = () => {};
      } catch {
        intento += 1;
        reintento = setTimeout(conectar, Math.min(1000 * 2 ** intento, 15000));
      }
    };

    conectar();
    return () => {
      activa = false;
      if (reintento) clearTimeout(reintento);
      conexion?.close();
    };
  }, []);
}
