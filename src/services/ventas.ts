import api from '../lib/axiosConfig';

export const getVentasPaginated = (params: {
  page: number;
  limit: number;
  search?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}) => {
  return api.get('/ventas', { params });
};

export const getVentasPaginatedforUser = (params: {
  page: number;
  limit: number;
  search?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}) => {
  return api.get('/ventas/listadopaginado', { params });
};


export const crearVenta = (data: {
  venta: any;
  detalles: any[];
  sistema_venta_por_lote: boolean;
}) => {
  return api.post('/ventas', data);
};

export const deleteVenta = (id: number) => {
  return api.delete(`/ventas/${id}`);
};

export const obtenerConfiguracionVenta = async () => {
  const [resLote, resVencimiento] = await Promise.all([
    api.get('/configuracion/valor/sistema_venta_por_lote'),
    api.get('/configuracion/valor/venta_fecha_vencimiento'),
  ]);

  return {
    sistema_venta_por_lote: resLote.data.valor,
    venta_fecha_vencimiento: resVencimiento.data.valor,
  };
};

export const pagarDeudaVenta = (data: {
  iddeuda: number;
  observacion: string;
  monto: number;
  detalle_transferencia?: any;
  detalle_tarjeta_venta_credito?: any
  detalle_cheque_venta_cobro?: any
  idformapago?: number | null;
  iddetalle_cuota?: number; // Cuota específica a pagar (opcional)
}) => {
  return api.post('/deuda-venta/pagar', data);
};

export const listarDetallePagosDeudaVenta = (
  iddeuda: number,
  params: { page: number; limit: number; search?: string; fecha_inicio?: string; fecha_fin?: string }
) => {
  return api.get(`/deuda-venta/listar-detalle-pagos/${iddeuda}`, { params });
};

export const anularPagoDeudaVenta = (idpago: number) => {
  return api.put(`/deuda-venta/anular-pago/${idpago}`);
};

export const anularVentaProgramada = (idVenta: number) => {
  return api.put(`/ventas-programadas/anular/${idVenta}`);
};

export const listarDeudasVenta = (params: {
  page: number;
  limit: number;
  search?: string;
  estado?: string; 
}) => {
  return api.get('/deuda-venta/listar', { params });
};

export const listarDeudasVentaAgrupadasPorCliente = (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  return api.get('/deuda-venta/listar-por-cliente', { params });
};

export const listarDeudasClienteConCuotasDetalle = (params: {
  page: number;
  limit: number;
  search?: string;
  order?: 'ASC' | 'DESC';
}) => {
  return api.get('/deuda-venta/listar-cliente-cuotas-detalle', { params });
};

export const listarClientesConCuotasVencidas = (params: {
  page: number;
  limit: number;
  search?: string;
  diasAtraso?: string;
}) => {
  return api.get('/deuda-venta/listar-clientes-cuotas-vencidas', { params });
};

export const listarDeudasPorClienteId = (
  idcliente: number | string,
  params: {
    page: number;
    limit: number;
    estado?: string;
  }
) => {
  return api.get(`/deuda-venta/listar-por-cliente-id/${idcliente}`, { params });
};

export const listarDeudasVentaAgrupadasPorClienteSinPaginar = () => {
  return api.get('/deuda-venta/listar-por-cliente-total')
};

export const comprobantePagoDeudaDetalleId = (idpago_deuda: number | string) => {
  return api.get(`/deuda-venta/comprobante/${idpago_deuda}`);
};

export const listarDeudasVentaCompletoPorCliente = (params: {
  numDocumento?: string;
  estado?: string;
}) => {
  return api.get('/deuda-venta/listar-completo', { params });
};

export const listarDetallePagosDeudaCompleto = (iddeuda: number | string) => {
  return api.get(`/deuda-venta/listar-detalle-pagos-completo/${iddeuda}`);
};

export const listarVentasProgramadas = (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  return api.get('/ventas-programadas', { params });
};

export const listarVentasProgramadasForUsers = (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  return api.get('/ventas-programadas/listadopaginado', { params });
};

export const getGanancias = (params: {
  tipo?: 'dia' | 'mes' | 'año';
  fecha_inicio?: string;
  fecha_fin?: string;
  limit?: number;
}) => {
  return api.get('/ventas/ganancias', { params });
};

export const comprobanteVenta = (idVenta: number) => {
  return api.get(`/ventas/comprobante/${idVenta}`);
};

export type ProgresoComprobante = { porcentaje: number; mensaje: string; segundos: number; estado: string };
export const generarComprobanteConProgreso = async (
  idVenta: number, tipo: 'ticket' | 'pagare', onProgress?: (p: ProgresoComprobante) => void,
) => {
  const base = String(api.defaults.baseURL || '');
  const wsUrl = `${base.replace(/^http/, 'ws').replace(/\/api\/?$/, '')}/ws`;
  const token = localStorage.getItem('auth_token');
  let socket: WebSocket | undefined;
  let jobId = '';
  const pendientes: any[] = [];
  try {
    if (token) {
      socket = new WebSocket(wsUrl);
      socket.onopen = () => socket?.send(JSON.stringify({ type: 'auth', token, canal: 'comprobantes' }));
      socket.onmessage = (event) => {
        try { const msg = JSON.parse(event.data); if (msg.type === 'comprobante') { if (!jobId) pendientes.push(msg); else if (msg.jobId === jobId) onProgress?.(msg); } } catch { /* ignora mensajes no JSON */ }
      };
    }
  } catch { /* el sondeo HTTP mantiene el flujo */ }
  try {
    const creado = await api.post(`/ventas/comprobante-trabajo/${idVenta}/${tipo}`);
    jobId = creado.data.jobId;
    onProgress?.(creado.data);
    pendientes.filter((p) => p.jobId === jobId).forEach(onProgress || (() => {}));
    const limite = Date.now() + 180_000;
    while (Date.now() < limite) {
      const { data } = await api.get(`/ventas/comprobante-trabajo/estado/${jobId}`);
      onProgress?.(data);
      if (data.estado === 'done') return data.resultado;
      if (data.estado === 'error') throw new Error(data.error || 'No se pudo generar el comprobante.');
      await new Promise((resolve) => setTimeout(resolve, 900));
    }
    throw new Error('La generación del comprobante está tardando más de lo esperado. Puedes volver a intentarlo.');
  } finally { socket?.close(); }
};

export const validarVencimientoPorLote = (detalles: any[]) => {
  return api.post('/ventas/verificar-fecha-vencimiento-lote', { detalles });
};

export const validarVencimientoSimulado = (productos: { idproducto: number, cantidad: number }[]) => {
  return api.post('/ventas/verificar-fecha-vencimiento-simulador', { productos });
};

export const verificarFechaVencimiento = (payload: {
  detalles: any[],
  sistema_venta_por_lote: boolean
}) => {
  return api.post('/ventas/verificar-fecha-vencimiento', payload);
};

export const prepararDetalles = (productos: { idproducto: number, cantidad: number }[]) => {
  return api.post('/ventas/preparar-detalles', { productos });
};

export const obtenerResumenVentasDia = () => {
  return api.get('/ventas/resumen-ventas-dia');
};

export const getVentasMensuales = (year: number) => {
  return api.get('/ventas/ventas-mensuales', {
    params: { year },
  });
};

//   Obtener ventas programadas por cliente
export const getVentasProgramadasPorCliente = (idcliente: number) => {
  return api.get(`/ventas-programadas/cliente/${idcliente}`);
};

export const getProgresoMetaMensual = () => {
  return api.get('/ventas/progreso-meta-mensual');
};

export const getEstadisticasVentas = (year: number) => {
  return api.get('/ventas/estadisticas-anuales', { params: { year } });
};

export const getProductosMasVendidos = (limit = 5) => {
  return api.get('/ventas/productos-mas-vendidos', { params: { limit } });
};

//   Listar ventas programadas (paginadas y filtradas)
export const getVentasProgramadasPaginated = (params: {
  limit: number;
  offset: number;
  search?: string;
}) => {
  return api.get('/ventas-programadas', { params });
};

//   Crear venta programada
export const createVentaProgramada = (data: {
  idcliente: number;
  idproducto: number;
  cantidad: number;
  fecha_inicio: string;
  dia_programado: number;
  iddetalle?: number;
  estado?: string;
  observacion?: string;
}) => {
  return api.post('/ventas-programadas', data);
};

export const obtenerLotesProducto = (idproducto: number) => {
  // para_venta: los precios llegan con la promoción vigente (ver server utils/promo.js).
  return api.get(`/lotes-producto/producto/${idproducto}`, { params: { para_venta: 1 } });
};

//   Obtener datos para el reporte de ventas (sin generar PDF)
export const getReporteVentasData = (params: {
  search?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo?: string; // 'contado', 'credito' o '' (todos)
}) => {
  return api.get('/ventas/reporte/data', { params });
};

//   Generar PDF del reporte de ventas
export const generateReporteVentasPDF = (params: {
  search?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo?: string; // 'contado', 'credito' o '' (todos)
}) => {
  return api.get('/ventas/reporte/pdf', { params });
};

//   Generar Libro de Ventas formato SET
export const generateLibroVentasPDF = (params: {
  fecha_inicio?: string;
  fecha_fin?: string;
}) => {
  return api.get('/ventas/libro-ventas/pdf', { params });
};
