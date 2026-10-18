import { FaPills } from 'react-icons/fa';

export interface ValoresFarmacia {
  principio_activo?: string | null;
  laboratorio?: string | null;
  receta?: string | null;
  stock_minimo?: string | number | null;
}

interface Props {
  valores: ValoresFarmacia;
  onCambio: (campo: 'principio_activo' | 'laboratorio' | 'receta' | 'stock_minimo', valor: string) => void;
  className?: string;
}

export const ETIQUETA_RECETA: Record<string, string> = { libre: 'Venta libre', receta: 'Con receta', controlado: 'Controlado' };

const entrada = 'mt-1 w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';
const etiqueta = 'block text-xs font-semibold text-slate-700 dark:text-gray-300';

/**
 * Datos opcionales para farmacias: principio activo (para buscar «¿tenés algo con ibuprofeno?»), laboratorio,
 * condición de venta (libre / con receta / controlado: Tuki avisa al vender) y stock mínimo (avisa cuándo reponer).
 */
export default function DatosFarmaciaProducto({ valores, onCambio, className = '' }: Props) {
  const hayDatos = !!(valores.principio_activo || valores.laboratorio || (valores.receta && valores.receta !== 'libre') || valores.stock_minimo);
  return (
    <details open={hayDatos} className={`group rounded-xl border-2 border-orange-200 bg-orange-50/60 p-3 dark:border-orange-800/50 dark:bg-orange-900/10 ${className}`}>
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-orange-800 dark:text-orange-200">
        <FaPills aria-hidden="true" />
        Datos de farmacia <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-gray-800">opcional</span>
        <span className="ml-auto text-xs font-semibold text-orange-700 group-open:hidden">Abrir</span>
      </summary>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={etiqueta}>Principio activo
          <input type="text" data-campo="principio_activo" value={valores.principio_activo ?? ''} maxLength={150} onChange={(e) => onCambio('principio_activo', e.target.value)} placeholder="Ej: Ibuprofeno" className={entrada} />
        </label>
        <label className={etiqueta}>Laboratorio
          <input type="text" data-campo="laboratorio" value={valores.laboratorio ?? ''} maxLength={100} onChange={(e) => onCambio('laboratorio', e.target.value)} placeholder="Ej: Bayer" className={entrada} />
        </label>
        <label className={etiqueta}>Condición de venta
          <select data-campo="receta" value={valores.receta || 'libre'} onChange={(e) => onCambio('receta', e.target.value)} className={entrada}>
            <option value="libre">Venta libre</option>
            <option value="receta">Con receta</option>
            <option value="controlado">Controlado</option>
          </select>
          <span className="mt-1 block text-[11px] font-normal text-slate-500 dark:text-gray-400">Al vender, Tuki recuerda pedir la receta.</span>
        </label>
        <label className={etiqueta}>Stock mínimo (en unidades)
          <input type="number" min={0} step="any" inputMode="decimal" data-campo="stock_minimo" value={valores.stock_minimo ?? ''} onChange={(e) => onCambio('stock_minimo', e.target.value)} placeholder="Ej: 10" className={entrada} />
          <span className="mt-1 block text-[11px] font-normal text-slate-500 dark:text-gray-400">Cuando quede esta cantidad o menos aparece en «Alertas de inventario».</span>
        </label>
      </div>
    </details>
  );
}
