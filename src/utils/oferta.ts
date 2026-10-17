/**
 * Oferta por cantidad ("3 por ₲ 10.000"): se aplica sola sobre las unidades SUELTAS de una línea de venta (packs y
 * cajas ya tienen su precio). Es la misma regla que usa el servidor, que además la recalcula al guardar.
 */
export const unidadesSueltasDe = (d: any): number => {
  if (d?.unidad_medida === 'CAJA') return Number(d.cant_unidades_sueltas || 0);
  return Math.max(Number(d?.cantidad || 0) - Number(d?.cant_packs_vender || 0) * Number(d?.cant_p_pack || 0), 0);
};

export const tieneOferta = (d: any): boolean => Number(d?.oferta_cantidad) >= 2 && Number(d?.oferta_precio) > 0;

export const infoOferta = (d: any) => {
  if (!tieneOferta(d)) return null;
  const n = Number(d.oferta_cantidad);
  const precio = Number(d.oferta_precio);
  const suelta = Number(d.precio_venta || 0);
  const ahorroPorCombo = n * suelta - precio;
  const sueltas = unidadesSueltasDe(d);
  const combos = ahorroPorCombo > 0 ? Math.floor(sueltas / n) : 0;
  const resto = sueltas % n;
  return {
    n,
    precio,
    porUnidad: precio / n,
    ahorroPorCombo,
    conviene: ahorroPorCombo > 0,
    combos,
    descuento: Math.round(combos * Math.max(ahorroPorCombo, 0) * 100) / 100,
    // cuántas unidades más hacen falta para completar el próximo combo (solo si ya lleva alguna suelta)
    faltan: ahorroPorCombo > 0 && sueltas > 0 && resto > 0 ? n - resto : 0,
  };
};

export const descuentoOfertaDe = (d: any): number => infoOferta(d)?.descuento ?? 0;
