import axios from 'axios';
import { esPeticionIA, iniciarProgresoIA, terminarProgresoIA } from '../services/progresoIA';

// VITE_API_BASE_URL permite apuntar a un backend local (ej. server-desa-3010, puerto 3010)
// sin tocar este archivo — Vite solo expone al cliente las variables con prefijo VITE_, por
// eso no se reusa el nombre plano que usan los scripts de Node (scripts/promo/). Sin la
// variable definida usa el backend local de desarrollo: en producción SIEMPRE hay que definirla.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

const api = axios.create({
  baseURL,
  withCredentials: true,

//  headers: {
//    'ngrok-skip-browser-warning': 'true' //   Header específico para ngrok
//  }
});

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Consultas a la IA: se pide progreso en vivo (el servidor lo publica por WebSocket con este id).
  if (esPeticionIA(config.url, config.method) && config.data && typeof config.data === 'object') {
    const id = await iniciarProgresoIA();
    config.data = { ...config.data, progresoId: id };
    (config as any).__progresoId = id;
  }
  return config;
});

api.interceptors.response.use(
  (res) => { terminarProgresoIA((res.config as any).__progresoId); return res; },
  (err) => { terminarProgresoIA((err?.config as any)?.__progresoId); return Promise.reject(err); },
);

// Se avisa al resto de la app que la licencia venció sin acoplar este archivo a
// React: cualquier componente puede escuchar el evento. El detalle trae el
// payload del backend (fecha, plan, monto) para poder mostrarlo en la pantalla.
export const EVENTO_LICENCIA_VENCIDA = 'licencia:vencida';

api.interceptors.response.use(
  res => res,
  err => {
    const status   = err.response?.status;
    const endpoint = err.config?.url || '';
    const data     = err.response?.data;

    if (status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('usuario');
      // Con HashRouter la ruta real es /#/login, no /login — window.location.href='/login'
      // recargaba el index.html sin hash, cayendo otra vez en "No routes matched location".
      window.location.hash = '#/login';
    }

    // Licencia vencida: el backend responde 403 con error 'LICENCIA_VENCIDA' en
    // todas las rutas protegidas. No se cierra la sesión —el usuario sigue
    // autenticado, lo que caducó es el pago— así que se muestra la pantalla de
    // bloqueo en lugar de mandarlo al login, que sería confuso.
    if (status === 403 && data?.error === 'LICENCIA_VENCIDA') {
      window.dispatchEvent(
        new CustomEvent(EVENTO_LICENCIA_VENCIDA, { detail: data })
      );
    }

    return Promise.reject(err);
  }
);

export default api;
