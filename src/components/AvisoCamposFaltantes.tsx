import { resaltarCampos } from '../utils/camposInvalidos';

export interface CampoFaltante { clave: string; etiqueta: string; detalle?: string }

/**
 * Cartel que no tapa la pantalla: lista lo que falta y cada ítem lleva al campo (lo resalta y baja hasta él).
 * Se muestra solo si hay algo pendiente, así desaparece solo a medida que se completa.
 */
export default function AvisoCamposFaltantes({ faltantes, className = '' }: { faltantes: CampoFaltante[]; className?: string }) {
  if (!faltantes.length) return null;
  return (
    <div role="alert" className={`rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-700/60 dark:bg-red-900/20 dark:text-red-100 ${className}`}>
      <p className="font-extrabold">Falta completar {faltantes.length === 1 ? 'este dato' : 'estos datos'} (están marcados en rojo):</p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {faltantes.map((f) => (
          <li key={f.clave}>
            <button type="button" onClick={() => resaltarCampos([f.clave])} className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-200">
              {f.etiqueta}{f.detalle ? ` · ${f.detalle}` : ''}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
