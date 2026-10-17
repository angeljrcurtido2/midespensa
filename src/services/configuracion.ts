import api from '../lib/axiosConfig';

//   Obtener valor booleano (true/false)
export const getConfiguracionValor = (clave: string) => {
  return api.get(`/configuracion/valor/${clave}`);
};

//   Obtener valor como string (por ejemplo, para template seleccionado)
export const getConfiguracionValorString = (clave: string) => {
  return api.get(`/configuracion/string/${clave}`);
};

//   Guardar (crear o actualizar) una configuración
export const guardarConfiguracion = (clave: string, valor: any) => {
  return api.post('/configuracion', { clave, valor });
};

//   Guardar (crear o actualizar) una configuración
export const updateConfiguration = (clave: string, valor: any) => {
  return api.post('/configuracion/update', { clave, valor });
};

export const descargarBackup = async () => {
  const { data } = await api.get('/utils/backup', {
    responseType: 'blob'     
  });
  return data as Blob;
};