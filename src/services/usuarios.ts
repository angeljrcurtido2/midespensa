import api from '../lib/axiosConfig';

export const getUsuariosPaginated = (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  return api.get('/usuario/paginar', { params });
};

export const crearUsuario = (data: {
   login: string;
  password: string;
  acceso: string;
  estado?: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  cedula: string;
  email: string;
}) => {
  return api.post('/usuario/register', data);
};

/** Alta desde el sistema (solo el proveedor; el servidor responde 403 al resto). */
export const crearUsuarioComoProveedor = (data: {
  login: string;
  password: string;
  acceso: string;
  estado?: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  cedula: string;
  email: string;
}) => {
  return api.post('/usuario', data);
};

export const getUsuarioId = (id: number | string) => {
  return api.get(`/usuario/${id}`);
};

export const getDataUser = () => {
  return api.get(`/usuario/mi-cargo`);
};

export const getCargoUsuario = () => {
  return api.get(`/usuario/mi-cargo`);
};

export const deleteUsuario = (id: number) => {
  return api.delete(`/usuario/${id}`);
};

export const updateUsuario = (id: number | string, data: any) => {
  return api.put(`/usuario/${id}`, data);
};
