'use client';

import { FaExclamationTriangle, FaClock } from 'react-icons/fa';
import type { MiLicencia } from '../services/licencias';

interface BannerLicenciaProps {
  licencia: MiLicencia | null;
}

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Aviso de vencimiento. Sólo aparece en 'por_vencer' y 'gracia'.
 *
 * En 'gracia' el tono es más fuerte porque la licencia YA venció y el bloqueo
 * es inminente: el cliente tiene que enterarse antes de quedarse sin sistema,
 * no cuando ya no puede facturar.
 */
export default function BannerLicencia({ licencia }: BannerLicenciaProps) {
  if (!licencia) return null;

  const estado = licencia.estado_efectivo;
  if (estado !== 'por_vencer' && estado !== 'gracia') return null;

  const enGracia = estado === 'gracia';
  const diasRestantes = licencia.dias_restantes ?? 0;
  const diasHastaBloqueo = licencia.dias_hasta_bloqueo ?? 0;

  const estilos = enGracia
    ? 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200'
    : 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200';

  return (
    <div className={`border-l-4 px-4 py-3 mb-4 rounded-r-lg flex items-start gap-3 ${estilos}`}>
      <span className="mt-0.5 shrink-0">
        {enGracia ? <FaExclamationTriangle size={18} /> : <FaClock size={18} />}
      </span>
      <div className="text-sm">
        {enGracia ? (
          <>
            <strong>Tu licencia venció el {formatearFecha(licencia.fecha_vencimiento)}.</strong>{' '}
            {diasHastaBloqueo > 0
              ? `El sistema se bloquea en ${diasHastaBloqueo} ${diasHastaBloqueo === 1 ? 'día' : 'días'}.`
              : 'El sistema se bloquea hoy.'}{' '}
            Regularizá el pago para seguir operando.
          </>
        ) : (
          <>
            <strong>
              Tu licencia vence en {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}
            </strong>{' '}
            ({formatearFecha(licencia.fecha_vencimiento)}). Renová para evitar el bloqueo.
          </>
        )}
      </div>
    </div>
  );
}
