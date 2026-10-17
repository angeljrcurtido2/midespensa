'use client';

import { useCallback, useEffect, useState } from 'react';
import { FaFilePdf, FaKey } from 'react-icons/fa';
import {
  getMiLicencia,
  getMisPagosLicencia,
  getMiReciboLicencia,
  type MiLicencia as TipoMiLicencia,
  type MiPagoLicencia,
} from '../../services/licencias';
import { descargarPdfBase64 } from '../../utils/descargarPdf';
import { renderTitle } from '../../clientes/utils/utils';
import ModalError from '../../components/ModalError';
import PagarLicencia from './PagarLicencia';

const fecha = (f?: string | null) => {
  if (!f) return '—';
  const d = new Date(f);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const gs = (n: number | string | null | undefined) => `${Math.round(Number(n) || 0).toLocaleString('es-PY')} Gs.`;

const ESTADOS: Record<string, { texto: string; clase: string }> = {
  activa: { texto: 'Al día', clase: 'bg-green-100 text-green-800' },
  por_vencer: { texto: 'Por vencer', clase: 'bg-amber-100 text-amber-800' },
  gracia: { texto: 'En período de gracia', clase: 'bg-orange-100 text-orange-800' },
  bloqueada: { texto: 'Vencida', clase: 'bg-red-100 text-red-800' },
  suspendida: { texto: 'Suspendida', clase: 'bg-red-100 text-red-800' },
  cancelada: { texto: 'Cancelada', clase: 'bg-gray-200 text-gray-700' },
};

/** Estado de la licencia del titular y sus recibos de pago (los autorizados por el proveedor se descargan). */
export default function MiLicencia() {
  const [lic, setLic] = useState<TipoMiLicencia | null>(null);
  const [pagos, setPagos] = useState<MiPagoLicencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [descargando, setDescargando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [l, p] = await Promise.all([getMiLicencia(), getMisPagosLicencia()]);
      setLic(l.data);
      setPagos(p.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'No se pudo cargar tu licencia');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const descargar = async (p: MiPagoLicencia) => {
    setDescargando(p.idpago);
    try {
      const { data } = await getMiReciboLicencia(p.idpago);
      descargarPdfBase64(data.reportePDFBase64, data.nombreArchivo || p.nro_recibo);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'No se pudo descargar el recibo');
    } finally {
      setDescargando(null);
    }
  };

  const estado = ESTADOS[lic?.estado_efectivo || ''] || { texto: '—', clase: 'bg-gray-100 text-gray-700' };

  return (
    <div className="p-4">
      {renderTitle({
        title: 'Mi licencia y recibos',
        subtitle: 'Estado de tu suscripción y tus comprobantes de pago',
        icon: <FaKey className="text-white text-3xl sm:text-4xl" />,
      })}

      {cargando && <p className="text-gray-500">Cargando…</p>}

      {!cargando && lic?.tiene_licencia && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
            <span className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-bold ${estado.clase}`}>{estado.texto}</span>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Vence</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">{fecha(lic.fecha_vencimiento)}</p>
            <p className="text-xs text-gray-500">
              {(lic.dias_restantes ?? 0) >= 0 ? `faltan ${lic.dias_restantes} días` : `venció hace ${Math.abs(lic.dias_restantes ?? 0)} días`}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Plan</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">{lic.plan_nombre || 'Sin plan'}</p>
            {lic.precio_mensual ? <p className="text-xs text-gray-500">{gs(lic.precio_mensual)} por mes</p> : null}
          </div>
          <div className="rounded-2xl bg-white p-4 shadow dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Prórroga</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {lic.prorroga_hasta && new Date(lic.prorroga_hasta) >= new Date(new Date().toDateString()) ? `hasta ${fecha(lic.prorroga_hasta)}` : 'Sin prórroga'}
            </p>
          </div>
        </div>
      )}

      {!cargando && lic?.tiene_licencia && (
        <div className="mb-8 rounded-2xl bg-gray-50 p-4 dark:bg-gray-900/40">
          <h2 className="mb-1 text-xl font-bold text-gray-800 dark:text-gray-100">Pagar mi licencia</h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Pagá por transferencia o QR y avisanos con el comprobante: apenas lo verifiquemos, tu licencia se renueva.
          </p>
          <PagarLicencia montoSugerido={lic.precio_mensual} onEnviado={cargar} />
        </div>
      )}

      <h2 className="mb-2 text-lg font-bold text-gray-800 dark:text-gray-100">Mis pagos</h2>
      <div className="overflow-x-auto rounded-2xl bg-white shadow dark:bg-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr className="text-left text-gray-600 dark:text-gray-300">
              <th className="px-4 py-3 font-semibold">Recibo</th>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Período</th>
              <th className="px-4 py-3 font-semibold">Monto</th>
              <th className="px-4 py-3 font-semibold text-right">Descargar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {!cargando && pagos.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Todavía no hay pagos registrados.</td></tr>
            )}
            {pagos.map((p) => (
              <tr key={p.idpago} className="text-gray-700 dark:text-gray-300">
                <td className="px-4 py-3 font-medium">{p.nro_recibo}</td>
                <td className="px-4 py-3 whitespace-nowrap">{fecha(p.fecha_pago)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-xs">{fecha(p.periodo_desde)} → {fecha(p.periodo_hasta)}</td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold">{gs(p.monto)}</td>
                <td className="px-4 py-3 text-right">
                  {p.recibo_autorizado ? (
                    <button
                      onClick={() => descargar(p)}
                      disabled={descargando === p.idpago}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      <FaFilePdf /> {descargando === p.idpago ? 'Generando…' : 'Descargar recibo'}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500">Recibo pendiente de autorización</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalError isOpen={!!error} onClose={() => setError('')} message={error} />
    </div>
  );
}
