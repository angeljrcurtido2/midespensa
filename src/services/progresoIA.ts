import { useSyncExternalStore } from 'react';

/**
 * Progreso en vivo de las consultas a la IA (Ollama): el servidor avisa por WebSocket (canal 'progreso')
 * cada avance de la consulta que este navegador hizo. El interceptor de axios (lib/axiosConfig.ts) le
 * pone un `progresoId` a cada petición del chat y este módulo guarda el avance para <ProgresoIA />.
 */
export interface EstadoProgresoIA {
  activo: boolean;
  id: string | null;
  inicio: number;
  mensaje: string;
  porcentaje: number;
  tokens: number;
  /** Texto parcial de la respuesta (solo el chat de métricas, que responde en lenguaje natural). */
  texto: string;
}

const INACTIVO: EstadoProgresoIA = { activo: false, id: null, inicio: 0, mensaje: '', porcentaje: 0, tokens: 0, texto: '' };

let estado: EstadoProgresoIA = INACTIVO;
const oyentes = new Set<() => void>();
const cambiar = (nuevo: EstadoProgresoIA) => {
  estado = nuevo;
  oyentes.forEach((o) => o());
};

// Misma base que lib/axiosConfig.ts (no se importa de allí para no crear un ciclo de módulos).
const urlWebSocket = () => {
  const base = String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api');
  return base.replace(/^http/, 'ws').replace(/\/api\/?$/, '') + '/ws';
};

// ── Conexión WebSocket (una sola, se abre al primer uso y se reabre sola si se cae) ──
let socket: WebSocket | null = null;
let lista: Promise<boolean> | null = null;

const conectar = (): Promise<boolean> => {
  if (lista && socket && socket.readyState <= 1) return lista;
  const token = localStorage.getItem('auth_token');
  if (!token) return Promise.resolve(false);
  lista = new Promise<boolean>((resolve) => {
    try {
      const ws = new WebSocket(urlWebSocket());
      socket = ws;
      const corte = setTimeout(() => resolve(false), 2500);
      ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token, canal: 'progreso' }));
      ws.onmessage = (m) => {
        let msg: any;
        try { msg = JSON.parse(String(m.data)); } catch { return; }
        if (msg.type === 'ready') { clearTimeout(corte); resolve(true); return; }
        if (msg.type === 'progreso' && msg.id === estado.id) {
          cambiar({
            ...estado,
            mensaje: msg.mensaje || estado.mensaje,
            // La barra nunca retrocede aunque lleguen eventos fuera de orden.
            porcentaje: Math.max(estado.porcentaje, Number(msg.porcentaje) || 0),
            tokens: Number(msg.tokens) || estado.tokens,
            texto: typeof msg.texto === 'string' ? msg.texto : estado.texto,
          });
        }
      };
      ws.onclose = () => { clearTimeout(corte); resolve(false); if (socket === ws) { socket = null; lista = null; } };
      ws.onerror = () => {};
    } catch {
      resolve(false);
    }
  });
  return lista;
};

const nuevoId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** Endpoints del chat que llaman a Ollama y muestran progreso. */
const ENDPOINTS_IA = /\/voice\/(parse-income|register-income|parse-expense|register-expense|parse-provider|execute-provider-action|chat-provider|chat-cliente|chat-facturador|chat-metricas|asistente\/(mensaje|producto))$/;

export const esPeticionIA = (url?: string, metodo?: string) =>
  String(metodo || '').toLowerCase() === 'post' && ENDPOINTS_IA.test(String(url || '').split('?')[0]);

/** Antes de enviar: abre el canal (espera poco) y deja el progreso en "enviando". Devuelve el id a mandar. */
export const iniciarProgresoIA = async (): Promise<string> => {
  const id = nuevoId();
  cambiar({ ...INACTIVO, activo: true, id, inicio: Date.now(), mensaje: 'Enviando tu mensaje a la IA…', porcentaje: 3 });
  await Promise.race([conectar(), new Promise((r) => setTimeout(r, 1200))]);
  return id;
};

export const terminarProgresoIA = (id: string | null) => {
  if (id && estado.id === id) cambiar(INACTIVO);
};

const suscribir = (o: () => void) => { oyentes.add(o); return () => { oyentes.delete(o); }; };

export const useProgresoIA = (): EstadoProgresoIA => useSyncExternalStore(suscribir, () => estado);
