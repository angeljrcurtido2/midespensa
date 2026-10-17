import { useEffect, useState } from 'react';
import { useProgresoIA } from '../services/progresoIA';

/**
 * Barra de progreso de la consulta a la IA en curso: etapa, porcentaje, segundos y, en el chat de
 * métricas, el texto de la respuesta a medida que se escribe. Solo se ve mientras hay una consulta.
 */
const ProgresoIA = ({ className = '' }: { className?: string }) => {
  const p = useProgresoIA();
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    if (!p.activo) return;
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, [p.activo]);

  if (!p.activo) return null;
  const segundos = Math.max(0, (ahora - p.inicio) / 1000);
  // Sin eventos del servidor (WebSocket caído) la barra avanza sola y despacio, sin llegar al final.
  const porcentaje = Math.max(p.porcentaje, Math.min(90, 3 + segundos * 1.2));

  return (
    <div data-testid="progreso-ia" role="status" aria-live="polite" className={`rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-md ${className}`}>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-700">{p.mensaje || 'Procesando…'}</span>
        <span className="tabular-nums text-slate-500">{Math.round(porcentaje)}% · {segundos.toFixed(0)} s</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-[width] duration-300 ease-out" style={{ width: `${porcentaje}%` }} />
      </div>
      {p.texto && (
        <p className="mt-2 max-h-28 overflow-hidden whitespace-pre-wrap text-xs italic leading-snug text-slate-500">
          {p.texto.length > 280 ? '…' + p.texto.slice(-280) : p.texto}
        </p>
      )}
    </div>
  );
};

export default ProgresoIA;
