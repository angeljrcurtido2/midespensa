import api from '../lib/axiosConfig';

export const getFormasPago = () => {
  return api.get('/formas-pago');
};