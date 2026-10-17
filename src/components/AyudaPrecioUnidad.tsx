const gs = (n: number) => `₲ ${Math.round(n).toLocaleString('es-PY')}`;

interface Props {
  precio: string | number | null | undefined;
  unidades: string | number | null | undefined;
  precioSuelta: string | number | null | undefined;
  className?: string;
}

/**
 * Debajo del precio de un pack o una caja: cuánto sale cada unidad y cómo queda frente a la unidad suelta.
 * Verde si conviene (más barato); naranja si el pack/caja sale MÁS caro que la suelta (casi siempre un error de carga).
 */
export default function AyudaPrecioUnidad({ precio, unidades, precioSuelta, className = 'mt-1' }: Props) {
  const p = Number(String(precio ?? '').replace(',', '.'));
  const u = Number(unidades);
  const suelta = Number(String(precioSuelta ?? '').replace(',', '.'));
  if (!(u > 1) || !(p > 0)) return null;
  const porUnidad = p / u;
  const dif = suelta - porUnidad;
  const tono = !(suelta > 0) ? 'text-gray-500 dark:text-gray-400' : dif > 0.5 ? 'text-emerald-700 dark:text-emerald-400' : dif < -0.5 ? 'text-amber-700 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400';
  return (
    <p className={`${className} text-xs font-semibold ${tono}`}>
      {gs(porUnidad)} cada unidad
      {suelta > 0 ? (dif > 0.5 ? ` · ${gs(dif)} menos que suelta` : dif < -0.5 ? ' · ⚠ más caro que la unidad suelta' : ' · igual que suelta') : ''}
    </p>
  );
}
