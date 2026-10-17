'use client';

import { useCallback, useEffect, useState } from 'react';
import { FaCopy, FaUniversity, FaQrcode, FaPaperclip } from 'react-icons/fa';
import {
  crearAvisoPago,
  getCuentasCobro,
  getMisAvisosPago,
  getQrCuentaCobro,
  getComprobanteAviso,
  type AvisoPago,
  type CuentaCobro,
} from '../../services/licencias';

const hoyISO = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const fecha = (f?: string | null) => {
  if (!f) return '—';
  const d = new Date(f);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const gs = (n: number | string | null | undefined) => `${Math.round(Number(n) || 0).toLocaleString('es-PY')} Gs.`;

const ESTADO_AVISO: Record<string, { texto: string; clase: string }> = {
  pendiente: { texto: 'En revisión', clase: 'bg-amber-100 text-amber-800' },
  aprobado: { texto: 'Aprobado', clase: 'bg-green-100 text-green-800' },
  rechazado: { texto: 'Rechazado', clase: 'bg-red-100 text-red-800' },
};

const MEDIOS = [
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'qr', label: 'Pago con QR' },
  { value: 'deposito', label: 'Depósito' },
];

/** Abre en otra pestaña un archivo que está detrás de la sesión (blob). */
export const abrirBlob = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

function Qr({ idcuenta }: { idcuenta: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    getQrCuentaCobro(idcuenta)
      .then((r) => {
        url = URL.createObjectURL(r.data);
        setSrc(url);
      })
      .catch(() => setSrc(null));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [idcuenta]);
  if (!src) return null;
  return <img src={src} alt="QR de pago" className="h-40 w-40 rounded-lg border bg-white object-contain p-1" />;
}

interface Props {
  /** Monto mensual del plan, para sugerirlo en el formulario. */
  montoSugerido?: number | null;
  /** Se avisa al padre cuando se envía un aviso (para refrescar su estado). */
  onEnviado?: () => void;
}

/**
 * Pagar la licencia por transferencia o QR: muestra las cuentas del proveedor y permite avisar el pago con
 * el comprobante. El proveedor lo revisa y, al aprobarlo, la licencia se renueva sola.
 */
export default function PagarLicencia({ montoSugerido, onEnviado }: Props) {
  const [cuentas, setCuentas] = useState<CuentaCobro[]>([]);
  const [avisos, setAvisos] = useState<AvisoPago[]>([]);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState('');

  const [monto, setMonto] = useState(montoSugerido ? String(Math.round(montoSugerido)) : '');
  const [fechaPago, setFechaPago] = useState(hoyISO());
  const [medio, setMedio] = useState('transferencia');
  const [banco, setBanco] = useState('');
  const [referencia, setReferencia] = useState('');
  const [observacion, setObservacion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([getCuentasCobro(), getMisAvisosPago()]);
      setCuentas(c.data);
      setAvisos(a.data);
    } catch {
      setMensaje({ ok: false, texto: 'No se pudieron cargar los datos de pago' });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const copiar = async (texto: string, clave: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
      setTimeout(() => setCopiado(''), 1500);
    } catch {
      // sin portapapeles: el dato queda visible igual para copiarlo a mano
    }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    if (!monto || Number(monto) <= 0) return setMensaje({ ok: false, texto: 'Ingresá el monto que pagaste' });
    if (!archivo && !referencia.trim()) return setMensaje({ ok: false, texto: 'Subí el comprobante o ingresá el número de operación' });
    const datos = new FormData();
    datos.append('monto', monto);
    datos.append('fecha_pago', fechaPago);
    datos.append('medio_pago', medio);
    if (banco) datos.append('banco', banco);
    if (referencia.trim()) datos.append('referencia', referencia.trim());
    if (observacion.trim()) datos.append('observacion', observacion.trim());
    if (archivo) datos.append('comprobante', archivo);
    setEnviando(true);
    try {
      const r = await crearAvisoPago(datos);
      setMensaje({ ok: true, texto: r.data.message });
      setReferencia('');
      setObservacion('');
      setArchivo(null);
      await cargar();
      onEnviado?.();
    } catch (err: any) {
      setMensaje({ ok: false, texto: err?.response?.data?.error || 'No se pudo enviar el aviso' });
    } finally {
      setEnviando(false);
    }
  };

  const verComprobante = async (a: AvisoPago) => {
    try {
      abrirBlob((await getComprobanteAviso(a.idaviso)).data);
    } catch {
      setMensaje({ ok: false, texto: 'No se pudo abrir el comprobante' });
    }
  };

  const input = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white';
  const etiqueta = 'mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300';

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-100">
          <FaUniversity /> 1. Hacé la transferencia
        </h3>
        {cargando && <p className="text-sm text-gray-500">Cargando…</p>}
        {!cargando && cuentas.length === 0 && (
          <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            Todavía no hay cuentas de cobro cargadas. Contactá con el administrador para coordinar el pago.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {cuentas.map((c) => (
            <div key={c.idcuenta} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-base font-bold text-gray-800 dark:text-white">
                {c.banco} <span className="text-xs font-normal text-gray-500">({c.tipo === 'billetera' ? 'billetera' : 'cuenta'})</span>
              </p>
              {[
                ['Alias', c.alias],
                ['N° de cuenta', c.numero_cuenta],
                ['Titular', c.titular],
                ['CI / RUC', c.documento],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={String(k)} className="mt-1 flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                      {v}
                      <button
                        type="button"
                        onClick={() => copiar(String(v), `${c.idcuenta}-${k}`)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                        title="Copiar"
                      >
                        {copiado === `${c.idcuenta}-${k}` ? '✓' : <FaCopy />}
                      </button>
                    </span>
                  </div>
                ))}
              {c.nota && <p className="mt-2 text-xs text-gray-500">{c.nota}</p>}
              {c.tiene_qr && (
                <div className="mt-3">
                  <p className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                    <FaQrcode /> También podés pagar escaneando el QR
                  </p>
                  <Qr idcuenta={c.idcuenta} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-gray-100">2. Avisanos que pagaste</h3>
        <form onSubmit={enviar} className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-2">
          <div>
            <label className={etiqueta}>Monto pagado (Gs.)</label>
            <input className={input} inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))} />
          </div>
          <div>
            <label className={etiqueta}>Fecha del pago</label>
            <input type="date" className={input} max={hoyISO()} value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
          </div>
          <div>
            <label className={etiqueta}>Cómo pagaste</label>
            <select className={input} value={medio} onChange={(e) => setMedio(e.target.value)}>
              {MEDIOS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={etiqueta}>Cuenta a la que pagaste</label>
            <select className={input} value={banco} onChange={(e) => setBanco(e.target.value)}>
              <option value="">— Elegí —</option>
              {cuentas.map((c) => (
                <option key={c.idcuenta} value={c.banco}>{c.banco}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={etiqueta}>N° de operación / referencia</label>
            <input className={input} value={referencia} onChange={(e) => setReferencia(e.target.value)} maxLength={100} />
          </div>
          <div>
            <label className={etiqueta}>Comprobante (imagen o PDF, hasta 5 MB)</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-400 px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
              <FaPaperclip />
              <span className="truncate">{archivo ? archivo.name : 'Adjuntar archivo'}</span>
              <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className={etiqueta}>Observación (opcional)</label>
            <input className={input} value={observacion} onChange={(e) => setObservacion(e.target.value)} maxLength={255} />
          </div>
          {mensaje && (
            <p className={`sm:col-span-2 rounded-lg px-3 py-2 text-sm ${mensaje.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{mensaje.texto}</p>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {enviando ? 'Enviando…' : 'Enviar aviso de pago'}
            </button>
          </div>
        </form>
      </section>

      {avisos.length > 0 && (
        <section>
          <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-gray-100">Mis avisos de pago</h3>
          <div className="space-y-2">
            {avisos.map((a) => {
              const est = ESTADO_AVISO[a.estado] || ESTADO_AVISO.pendiente;
              return (
                <div key={a.idaviso} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {gs(a.monto)} <span className="font-normal text-gray-500">· {fecha(a.fecha_pago)}{a.banco ? ` · ${a.banco}` : ''}</span>
                    </p>
                    {a.estado === 'rechazado' && a.motivo_rechazo && <p className="text-xs text-red-600">Motivo: {a.motivo_rechazo}</p>}
                    {a.estado === 'aprobado' && a.nro_recibo && <p className="text-xs text-green-700">Recibo {a.nro_recibo}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {a.tiene_comprobante && (
                      <button type="button" onClick={() => verComprobante(a)} className="text-xs font-semibold text-blue-600 hover:underline">
                        Ver comprobante
                      </button>
                    )}
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${est.clase}`}>{est.texto}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
