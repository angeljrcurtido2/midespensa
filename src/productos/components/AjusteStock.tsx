import { useEffect, useMemo, useState } from 'react';
import { ajustarStockProducto, historialAjustesStock } from '../../services/productos';

interface Props {
  id: number | string;
  /** Stock actual en UNIDADES (así lo guarda el sistema). */
  stockActual: number | null;
  unidad?: string;
  /** Unidades que trae cada caja / cada pack (si el producto los usa). */
  porCaja?: number | string | null;
  porPack?: number | string | null;
  onActualizado: (stock: number) => void;
}

const MOTIVOS = ['Conteo físico', 'Mercadería dañada o vencida', 'Error de carga', 'Diferencia de inventario'];
const fmt = (n: number) => Number(n).toLocaleString('es-PY', { maximumFractionDigits: 3 });
const plural = (n: number, uno: string, varios: string) => `${fmt(n)} ${n === 1 ? uno : varios}`;
const num = (v: string) => (v === '' ? 0 : Number(v));

/** Reparte un total de unidades en cajas, packs y sueltas (lo que se vería contando la mercadería). */
const repartir = (total: number, caja: number, pack: number) => {
  let resto = Math.max(0, Math.round(total));
  const cajas = caja > 0 ? Math.floor(resto / caja) : 0;
  resto -= cajas * caja;
  const packs = pack > 0 ? Math.floor(resto / pack) : 0;
  resto -= packs * pack;
  return { cajas, packs, sueltas: resto };
};

const Campo = ({ etiqueta, ayuda, valor, paso, onCambio }: { etiqueta: string; ayuda: string; valor: string; paso: string; onCambio: (v: string) => void }) => (
  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
    {etiqueta}
    <input type="number" min="0" step={paso} inputMode="decimal" value={valor} onChange={(e) => onCambio(e.target.value)} onFocus={(e) => e.currentTarget.select()}
      className="mt-1 block w-36 rounded-lg border-2 border-amber-300 bg-white px-3 py-2 text-xl font-extrabold text-slate-900 focus:border-amber-500 focus:outline-none dark:bg-slate-800 dark:text-slate-100" />
    <span className="mt-1 block text-xs font-normal text-slate-500">{ayuda}</span>
  </label>
);

/**
 * Bloque de "Editar producto" para corregir el stock a mano. Se cuenta como se cuenta la mercadería: por cajas, packs y
 * unidades sueltas (o kilos / litros), y el total se calcula solo. El sistema guarda siempre unidades.
 */
export default function AjusteStock({ id, stockActual, unidad, porCaja, porPack, onActualizado }: Props) {
  const uni = String(unidad ?? '').toUpperCase();
  const caja = uni === 'CAJA' && Number(porCaja) > 0 ? Number(porCaja) : 0;
  const pack = Number(porPack) > 0 ? Number(porPack) : 0;
  const porPresentacion = caja > 0 || pack > 0;
  const medida = uni === 'KG' ? 'kilos' : uni === 'L' || uni === 'LITRO' ? 'litros' : uni === 'PAQUETE' ? 'paquetes' : 'unidades';

  const inicial = useMemo(() => (stockActual === null ? null : repartir(stockActual, caja, pack)), [stockActual, caja, pack]);
  const [cajas, setCajas] = useState('');
  const [packs, setPacks] = useState('');
  const [sueltas, setSueltas] = useState('');
  const [total, setTotal] = useState('');
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [otro, setOtro] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [verHistorial, setVerHistorial] = useState(false);

  // Los campos arrancan con lo que el sistema tiene hoy: solo se cambia lo que no coincide con el conteo.
  useEffect(() => {
    if (stockActual === null || !inicial) return;
    setCajas(String(inicial.cajas));
    setPacks(String(inicial.packs));
    setSueltas(String(inicial.sueltas));
    setTotal(String(Math.max(0, stockActual)));
  }, [stockActual, inicial]);

  const cargarHistorial = () => historialAjustesStock(id).then((r) => setHistorial(r.data?.data ?? [])).catch(() => undefined);
  useEffect(() => { if (verHistorial) void cargarHistorial(); }, [verHistorial, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const nuevo = porPresentacion ? num(cajas) * caja + num(packs) * pack + num(sueltas) : num(total);
  const hayNegativo = [cajas, packs, sueltas, total].some((v) => v !== '' && Number(v) < 0);
  const diff = stockActual === null ? 0 : Math.round((nuevo - stockActual) * 1000) / 1000;
  const sinCambios = stockActual !== null && Math.abs(diff) < 0.0005;
  const motivoFinal = motivo === 'Otro' ? otro.trim() : motivo;

  const guardar = async () => {
    if (hayNegativo || Number.isNaN(nuevo)) return setMensaje({ ok: false, texto: 'Revisá las cantidades: no pueden ser negativas.' });
    if (motivoFinal.length < 3) return setMensaje({ ok: false, texto: 'Elegí o escribí el motivo del ajuste.' });
    setGuardando(true);
    setMensaje(null);
    try {
      const r = await ajustarStockProducto(id, nuevo, motivoFinal);
      onActualizado(r.data.stock_nuevo);
      setMensaje({ ok: true, texto: `Listo. El stock quedó en ${fmt(r.data.stock_nuevo)} ${medida}.` });
      if (verHistorial) void cargarHistorial();
    } catch (e: any) {
      setMensaje({ ok: false, texto: e?.response?.data?.message || 'No se pudo actualizar el stock.' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section aria-labelledby="ajuste-stock" className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
      <h3 id="ajuste-stock" className="text-base font-bold text-slate-900 dark:text-slate-100">Ajustar stock</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">Contá la mercadería y escribí lo que hay en realidad. El total se calcula solo.</p>

      <div className="mt-3 flex flex-wrap items-start gap-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500">Hoy el sistema dice</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{stockActual === null ? '—' : fmt(stockActual)} <span className="text-sm font-semibold text-slate-500">{medida}</span></p>
          {porPresentacion && inicial && stockActual !== null && stockActual > 0 && (
            <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              = {[caja > 0 && inicial.cajas > 0 ? plural(inicial.cajas, 'caja', 'cajas') : '', pack > 0 && inicial.packs > 0 ? plural(inicial.packs, 'pack', 'packs') : '', inicial.sueltas > 0 || (inicial.cajas === 0 && inicial.packs === 0) ? plural(inicial.sueltas, 'suelta', 'sueltas') : ''].filter(Boolean).join(' + ')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-start gap-4">
          {porPresentacion ? (
            <>
              {caja > 0 && <Campo etiqueta="Cajas completas" ayuda={`1 caja = ${fmt(caja)} unidades`} valor={cajas} paso="1" onCambio={setCajas} />}
              {pack > 0 && <Campo etiqueta="Packs" ayuda={`1 pack = ${fmt(pack)} unidades`} valor={packs} paso="1" onCambio={setPacks} />}
              <Campo etiqueta="Unidades sueltas" ayuda="las que no forman caja ni pack" valor={sueltas} paso="1" onCambio={setSueltas} />
            </>
          ) : (
            <Campo etiqueta={`Cuántos ${medida} hay`} ayuda={uni === 'KG' || uni === 'L' || uni === 'LITRO' ? 'podés usar decimales, ej. 2,5' : 'lo que contaste'} valor={total} paso="any" onCambio={setTotal} />
          )}
        </div>

        <div className={`rounded-xl border-2 px-4 py-3 ${sinCambios ? 'border-slate-200 bg-white' : 'border-amber-400 bg-white'} dark:bg-slate-900`}>
          <p className="text-xs font-semibold text-slate-500">Va a quedar en</p>
          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">{fmt(nuevo)} <span className="text-sm font-semibold text-slate-500">{medida}</span></p>
          <p className={`text-xs font-bold ${sinCambios ? 'text-slate-500' : diff > 0 ? 'text-emerald-700' : 'text-red-600'}`} aria-live="polite">
            {sinCambios ? 'Sin cambios' : diff > 0 ? `Suma ${fmt(diff)}` : `Resta ${fmt(-diff)}`}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">¿Por qué se ajusta?
          <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:bg-slate-800 dark:text-slate-100">
            {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
            <option>Otro</option>
          </select>
        </label>
        {motivo === 'Otro' && (
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Escribí el motivo
            <input type="text" maxLength={200} value={otro} onChange={(e) => setOtro(e.target.value)} className="mt-1 block w-60 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100" />
          </label>
        )}
        <button type="button" onClick={guardar} disabled={guardando || sinCambios || hayNegativo} className="rounded-xl bg-amber-600 px-6 py-3 text-base font-bold text-white shadow hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300">
          {guardando ? 'Guardando…' : 'Guardar el stock'}
        </button>
      </div>

      {mensaje && <p role="status" className={`mt-3 text-sm font-bold ${mensaje.ok ? 'text-emerald-700' : 'text-red-600'}`}>{mensaje.texto}</p>}
      <button type="button" onClick={() => setVerHistorial((v) => !v)} className="mt-3 text-sm font-semibold text-blue-700 underline">{verHistorial ? 'Ocultar historial de ajustes' : 'Ver historial de ajustes'}</button>
      {verHistorial && (
        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {historial.length === 0 ? <p className="p-3 text-sm text-slate-500">Todavía no hubo ajustes.</p> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800"><tr><th className="px-3 py-2 text-left">Fecha</th><th className="px-3 py-2 text-right">Antes</th><th className="px-3 py-2 text-right">Después</th><th className="px-3 py-2 text-left">Motivo</th><th className="px-3 py-2 text-left">Quién</th></tr></thead>
              <tbody>{historial.map((h) => (
                <tr key={h.idajuste} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="whitespace-nowrap px-3 py-2">{new Date(h.created_at).toLocaleString('es-PY')}</td>
                  <td className="px-3 py-2 text-right">{fmt(h.stock_anterior)}</td>
                  <td className="px-3 py-2 text-right font-bold">{fmt(h.stock_nuevo)}</td>
                  <td className="px-3 py-2">{h.motivo}</td>
                  <td className="px-3 py-2">{h.nombre ?? '—'}</td>
                </tr>))}</tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
