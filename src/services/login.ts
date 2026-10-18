import api from '../lib/axiosConfig';
import { setIaDeLaCuenta } from '../config/featureFlags';

//   Login de usuario
export const loginUsuario = (login: string, password: string) => {
  return api.post('/auth/login', { login, password }).then((respuesta) => {
    // Cuentas con la IA apagada (ej. de prueba) no ven los botones de IA.
    setIaDeLaCuenta(respuesta.data?.ia_habilitada !== false);
    return respuesta;
  });
};

// Login con Google: se manda el ID token que entrega Google Identity Services; el servidor lo verifica y crea la cuenta
// (plan Free) si todavía no existe.
export const loginConGoogle = (credential: string) => {
  return api.post('/auth/google', { credential }).then((respuesta) => {
    setIaDeLaCuenta(respuesta.data?.ia_habilitada !== false);
    return respuesta;
  });
};

// Cierra la sesión en el backend para que borre la cookie httpOnly del token.
// El cliente no puede borrarla por su cuenta (es httpOnly), y si sobrevive, el
// próximo usuario que entre en este navegador queda autenticado como el anterior.
export const cerrarSesionApi = () => {
  return api.post('/auth/logout');
};