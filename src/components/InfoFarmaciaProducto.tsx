import { FaFileMedical, FaLock } from 'react-icons/fa';

interface Props {
  producto: { principio_activo?: string | null; laboratorio?: string | null; receta?: string | null };
  className?: string;
}

/** Insignia «Con receta» / «Controlado» (no muestra nada si es de venta libre). */
export function InsigniaReceta({ receta }: { receta?: string | null }) {
  if (receta === 'receta') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-800" title="Se vende con receta"><FaFileMedical aria-hidden="true" /> Con receta</span>;
  }
  if (receta === 'controlado') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-rose-800" title="Medicamento controlado"><FaLock aria-hidden="true" /> Controlado</span>;
  }
  return null;
}

/** Línea chica bajo el nombre del producto: principio activo · laboratorio + la insignia de receta. */
export default function InfoFarmaciaProducto({ producto, className = '' }: Props) {
  const texto = [producto.principio_activo, producto.laboratorio].filter(Boolean).join(' · ');
  if (!texto && (!producto.receta || producto.receta === 'libre')) return null;
  return (
    <p className={`flex flex-wrap items-center gap-1.5 text-xs text-teal-700 dark:text-teal-300 ${className}`}>
      {texto && <span>{texto}</span>}
      <InsigniaReceta receta={producto.receta} />
    </p>
  );
}
