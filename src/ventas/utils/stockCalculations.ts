/**
 * Utilidades para calcular stock disponible en tiempo real
 * considerando los productos ya agregados al carrito (detalles)
 */

export interface DetalleVenta {
  idproducto: number;
  idlote?: number;
  cantidad: number;
  cant_cajas_vender?: number;
  cant_unidades_sueltas?: number;
  cant_p_caja?: number;
  cant_p_pack?: number;
  cant_packs_vender?: number;
  unidad_medida: string;
}

export interface Producto {
  idproducto: number;
  stock: number;
  unidad_medida: string;
  cant_cajas?: number;
  cant_p_caja?: number;
}

export interface Lote {
  idlote: number;
  idproducto: number;
  stock_actual: number;
  unidad_medida: string;
  precio_venta_pack?: number | string;
  cant_p_pack?: number;
}

/**
 * Calcula el stock disponible de un producto descontando lo que ya está en detalles
 * @param producto - Producto del cual calcular stock disponible
 * @param detalles - Array de detalles de venta actuales
 * @returns Stock disponible considerando lo ya agregado al carrito
 */
export const calcularStockDisponibleProducto = (
  producto: Producto,
  detalles: DetalleVenta[]
): number => {
  // Filtrar detalles del mismo producto (sin lote o con sistema sin lotes)
  const detallesDelProducto = detalles.filter(
    (d) => d.idproducto === producto.idproducto && (!d.idlote || d.idlote === -1)
  );

  // Sumar cantidades ya agregadas
  const cantidadEnCarrito = detallesDelProducto.reduce((acc, d) => {
    if (d.unidad_medida === 'CAJA') {
      // Para productos CAJA, calcular unidades totales
      const cajas = parseFloat(d.cant_cajas_vender?.toString() || '0');
      const sueltas = parseFloat(d.cant_unidades_sueltas?.toString() || '0');
      const porCaja = parseFloat(d.cant_p_caja?.toString() || '0');
      const packs = parseFloat(d.cant_packs_vender?.toString() || '0');
      const porPack = parseFloat(d.cant_p_pack?.toString() || '0');
      return acc + (cajas * porCaja) + (packs * porPack) + sueltas;
    } else {
      return acc + parseFloat(d.cantidad?.toString() || '0');
    }
  }, 0);

  // Stock disponible = stock total - cantidad en carrito
  const stockDisponible = producto.stock - cantidadEnCarrito;

  return Math.max(0, stockDisponible); // No permitir valores negativos
};

/**
 * Calcula el stock disponible de un lote específico descontando lo que ya está en detalles
 * @param lote - Lote del cual calcular stock disponible
 * @param detalles - Array de detalles de venta actuales
 * @returns Stock disponible del lote considerando lo ya agregado al carrito
 */
export const calcularStockDisponibleLote = (
  lote: Lote,
  detalles: DetalleVenta[]
): number => {
  // Si es un lote nuevo (idlote = -1), retornar stock ilimitado
  if (lote.idlote === -1) {
    return 999999;
  }

  // Filtrar detalles del mismo lote
  const detallesDelLote = detalles.filter((d) => d.idlote === lote.idlote);

  // Sumar cantidades ya agregadas de este lote
  const cantidadEnCarrito = detallesDelLote.reduce((acc, d) => {
    if (d.unidad_medida === 'CAJA') {
      // Para productos CAJA, calcular unidades totales
      const cajas = parseFloat(d.cant_cajas_vender?.toString() || '0');
      const sueltas = parseFloat(d.cant_unidades_sueltas?.toString() || '0');
      const porCaja = parseFloat(d.cant_p_caja?.toString() || '0');
      const packs = parseFloat(d.cant_packs_vender?.toString() || '0');
      const porPack = parseFloat(d.cant_p_pack?.toString() || '0');
      return acc + (cajas * porCaja) + (packs * porPack) + sueltas;
    } else {
      return acc + parseFloat(d.cantidad?.toString() || '0');
    }
  }, 0);

  // Stock disponible del lote = stock actual - cantidad en carrito
  const stockDisponible = lote.stock_actual - cantidadEnCarrito;

  return Math.max(0, stockDisponible); // No permitir valores negativos
};

/**
 * Calcula cuántas cajas están disponibles de un producto/lote
 * @param stockDisponible - Stock disponible en unidades
 * @param cant_p_caja - Cantidad de unidades por caja
 * @returns Número de cajas completas disponibles
 */
export const calcularCajasDisponibles = (
  stockDisponible: number,
  cant_p_caja: number
): number => {
  if (!cant_p_caja || cant_p_caja <= 0) return 0;
  return Math.floor(stockDisponible / cant_p_caja);
};

/**
 * Valida si la cantidad ingresada excede el stock disponible
 * @param cantidadIngresada - Cantidad que se quiere agregar
 * @param stockDisponible - Stock disponible actual
 * @returns true si la cantidad es válida, false si excede el stock
 */
export const validarCantidadVsStock = (
  cantidadIngresada: number,
  stockDisponible: number
): boolean => {
  return cantidadIngresada <= stockDisponible;
};

/**
 * Obtiene el mensaje de error cuando se excede el stock
 * @param cantidadIngresada - Cantidad que se intentó agregar
 * @param stockDisponible - Stock disponible actual
 * @returns Mensaje de error descriptivo
 */
export const obtenerMensajeErrorStock = (
  cantidadIngresada: number,
  stockDisponible: number
): string => {
  if (stockDisponible === 0) {
    return '  No hay stock disponible de este producto. Ya agregaste todo el stock disponible al carrito.';
  }
  return `  Stock insuficiente. Disponible: ${stockDisponible} unidades. Intentaste agregar: ${cantidadIngresada} unidades.`;
};
