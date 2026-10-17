import api from '../lib/axiosConfig';

/**
 * Listar cuotas de una deuda específica
 */
export const listarCuotasPorDeuda = (iddeuda: number) => {
  return api.get(`/cuotas-venta/listar/${iddeuda}`);
};

/**
 * Listar cuotas pendientes de un cliente
 */
export const listarCuotasPendientesCliente = (idcliente: number) => {
  return api.get(`/cuotas-venta/listar-pendientes-cliente/${idcliente}`);
};

/**
 * Obtener detalle de una cuota específica
 */
export const obtenerDetalleCuota = (iddetalle_cuota: number) => {
  return api.get(`/cuotas-venta/detalle-cuota/${iddetalle_cuota}`);
};

/**
 * Obtener historial de pagos de una deuda con distribución
 */
export const obtenerHistorialPagos = (iddeuda: number) => {
  return api.get(`/cuotas-venta/historial-pagos/${iddeuda}`);
};

/**
 * Generar plan de cuotas para una deuda
 */
export const generarPlanCuotas = (data: {
  iddeuda: number;
  idventa: number;
  idcliente: number;
  monto_financiar: number;
  cant_cuota: number;
  tasa_interes_anual: number;
  dia_fecha_pago: number;
  fecha_inicio?: Date;
}) => {
  return api.post('/cuotas-venta/generar-plan', data);
};

/**
 * Simular plan de cuotas (sin guardar en BD)
 */
export const simularPlanCuotas = (data: {
  monto_financiar: number;
  cant_cuota: number;
  tasa_interes_anual: number;
  dia_fecha_pago?: number;
  fecha_inicio?: Date;
}) => {
  return api.post('/cuotas-venta/simular-plan', data);
};

/**
 * Aplicar un pago a las cuotas pendientes
 */
export const aplicarPagoCuotas = (data: {
  iddeuda: number;
  idpago_deuda: number;
  monto_pagado: number;
}) => {
  return api.post('/cuotas-venta/aplicar-pago', data);
};

/**
 * Simular aplicación de pago (sin guardar en BD)
 */
export const simularAplicacionPago = (data: {
  iddeuda: number;
  monto_pago: number;
}) => {
  return api.post('/cuotas-venta/simular-pago', data);
};

/**
 * Recalcular plan de cuotas (refinanciamiento)
 */
export const recalcularPlanCuotas = (iddeuda: number, data: {
  idventa: number;
  idcliente: number;
  monto_financiar: number;
  cant_cuota: number;
  tasa_interes_anual: number;
  dia_fecha_pago?: number;
  fecha_inicio?: Date;
}) => {
  return api.put(`/cuotas-venta/recalcular-plan/${iddeuda}`, data);
};

/**
 * Calcular intereses punitorios para cuotas vencidas
 */
export const calcularInteresesPunitorios = () => {
  return api.post('/cuotas-venta/calcular-intereses');
};
