import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import { getResumenAlertas, type ResumenAlertas } from '../../services/alertasInventario';

/**
 * Aviso del tablero: solo aparece si hay algo que atender (lotes vencidos o por vencer, productos para reponer).
 * Si no hay alertas, o la consulta falla, no muestra nada.
 */
export default function AlertasResumenInicio() {
  const navigate = useNavigate();
  const [r, setR] = useState<ResumenAlertas | null>(null);

  useEffect(() => {
    let vivo = true;
    getResumenAlertas().then((res) => { if (vivo) setR(res.data); }).catch(() => { /* sin aviso */ });
    return () => { vivo = false; };
  }, []);

  if (!r) return null;
  const items = [
    r.vencidos > 0 && { texto: `${r.vencidos} ${r.vencidos === 1 ? 'lote vencido' : 'lotes vencidos'}`, clase: 'bg-red-600 text-white' },
    r.por_vencer_30 > 0 && { texto: `${r.por_vencer_30} por vencer en 30 días`, clase: 'bg-amber-500 text-white' },
    r.reposicion > 0 && { texto: `${r.reposicion} para reponer${r.agotados ? ` (${r.agotados} agotados)` : ''}`, clase: 'bg-blue-600 text-white' },
  ].filter(Boolean) as { texto: string; clase: string }[];
  if (!items.length) return null;

  return (
    <button type="button" onClick={() => navigate('/productos/alertas')} aria-label="Ver las alertas de inventario" className="flex w-full flex-wrap items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-left shadow-sm hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-900/20">
      <span className="flex items-center gap-2 text-sm font-extrabold text-amber-900 dark:text-amber-100"><FaBell aria-hidden="true" /> Alertas de inventario</span>
      <span className="flex flex-wrap gap-2">
        {items.map((i) => <span key={i.texto} className={`rounded-full px-3 py-1 text-xs font-bold ${i.clase}`}>{i.texto}</span>)}
      </span>
      <span className="ml-auto text-xs font-bold text-amber-800 underline dark:text-amber-200">Ver detalle</span>
    </button>
  );
}
