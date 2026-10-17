/** ¿La promoción del producto está vigente hoy? (misma regla que el servidor: precio promo, activa y dentro de las fechas). */
export const promoVigenteHoy = (p: any): boolean => {
  const tiene = Number(p?.precio_promo) > 0 || Number(p?.precio_promo_caja) > 0 || Number(p?.precio_promo_pack) > 0;
  if (!tiene || Number(p?.promo_activa) === 0) return false;
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Asuncion' });
  const desde = p?.promo_desde ? String(p.promo_desde).slice(0, 10) : null;
  const hasta = p?.promo_hasta ? String(p.promo_hasta).slice(0, 10) : null;
  if (desde && desde > hoy) return false;
  if (hasta && hasta < hoy) return false;
  return true;
};

/** Campos de la línea de venta para ofrecer "Aplicar precio promo" (precios promo vigentes y los normales para volver). */
export const camposPromoLinea = (o: any) => ({
  promo_unidad: Number(o?.promo_unidad) > 0 ? Number(o.promo_unidad) : null,
  promo_caja: Number(o?.promo_caja) > 0 ? Number(o.promo_caja) : null,
  promo_pack: Number(o?.promo_pack) > 0 ? Number(o.promo_pack) : null,
  promo_titulo: o?.promo_titulo || null,
  promo_normal_unidad: Number(o?.precio_venta) || 0,
  promo_normal_caja: Number(o?.precio_venta_caja) || 0,
  promo_normal_pack: Number(o?.precio_venta_pack) || 0,
  // Oferta por cantidad ("3 por 10.000"): datos del producto para mostrarla en la venta; el servidor la recalcula.
  oferta_cantidad: Number(o?.oferta_cantidad) >= 2 ? Number(o.oferta_cantidad) : null,
  oferta_precio: Number(o?.oferta_precio) > 0 ? Number(o.oferta_precio) : null,
});
