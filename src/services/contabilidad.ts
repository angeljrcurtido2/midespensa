import api from '../lib/axiosConfig';

// Generar PDF del Libro Diario
export const generateLibroDiarioPDF = (params: {
  fecha_inicio?: string;
  fecha_fin?: string;
}) => {
  return api.get('/libro-diario/pdf', { params });
};

// Generar PDF del Libro Mayor
export const generateLibroMayorPDF = (params: {
  fecha_inicio?: string;
  fecha_fin?: string;
}) => {
  return api.get('/libro-mayor/pdf', { params });
};
