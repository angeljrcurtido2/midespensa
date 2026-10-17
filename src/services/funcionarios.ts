import api from '../lib/axiosConfig';

// Obtener todos los funcionarios sin paginación (para selects)
export const getAllFuncionarios = () => {
  return api.get('/funcionarios/all');
};

// Obtener funcionarios por usuario
export const getFuncionariosByUsuario = (idusuarios: number) => {
  return api.get(`/funcionarios/usuario/${idusuarios}`);
};

// Obtener funcionarios con paginación y búsqueda
export const getFuncionariosPaginated = (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  return api.get('/funcionarios', { params });
};

// Obtener funcionario por ID
export const getFuncionarioById = (id: number | string) => {
  return api.get(`/funcionarios/${id}`);
};

// Crear funcionario
export const createFuncionario = (data: {
  nombre: string;
  apellido: string;
  telefono?: string;
  tipo_funcionario: string;
  login: string;
  password: string;
  estado?: string;
  idusuarios?: number;
}) => {
  return api.post('/funcionarios', data);
};

// Actualizar funcionario
export const updateFuncionario = (id: number | string, data: {
  nombre: string;
  apellido: string;
  telefono?: string;
  tipo_funcionario: string;
  login: string;
  estado?: string;
}) => {
  return api.put(`/funcionarios/${id}`, data);
};

// Actualizar contraseña
export const updatePassword = (id: number | string, data: {
  password: string;
}) => {
  return api.put(`/funcionarios/${id}/password`, data);
};

// Cambiar estado
export const changeStatus = (id: number | string, data: {
  estado: string;
}) => {
  return api.put(`/funcionarios/${id}/status`, data);
};

// Eliminar funcionario (soft delete)
export const deleteFuncionario = (id: number | string) => {
  return api.delete(`/funcionarios/${id}`);
};
