'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { useAlVolverALaVentana } from '../../../hooks/useAlVolverALaVentana';
import { FaCashRegister, FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';
import {
  getCajas,
  getResponsablesCajas,
  type CajaListado,
  type CuadreCaja,
  type FiltrosCajas,
  type ResumenCajas,
} from '../../../services/cajas';
import { renderTitle } from '../../../clientes/utils/utils';
import ModalError from '../../../components/ModalError';

const gs = (n: number | null | undefined) => `${Math.round(Number(n) || 0).toLocaleString('es-PY')}`;
const gsConSigno = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(Math.round(n)).toLocaleString('es-PY')}`;

const fechaHora = (f?: string | null) => {
  if (!f) return '—';
  const d = new Date(f);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' });
};

const ESTADO_CUADRE: Record<CuadreCaja, { texto: string; clase: string }> = {
  abierta: { texto: 'Abierta', clase: 'bg-blue-100 text-blue-800' },
  cuadra: { texto: 'Cuadra', clase: 'bg-green-100 text-green-800' },
  sobrante: { texto: 'Sobrante', clase: 'bg-amber-100 text-amber-800' },
  faltante: { texto: 'Faltante', clase: 'bg-red-100 text-red-800' },
  sin_arqueo: { texto: 'Sin arqueo', clase: 'bg-gray-200 text-gray-700' },
};

const RESUMEN_VACIO: ResumenCajas = { ingresos: 0, egresos: 0, diferencia_neta: 0, cuadran: 0, no_cuadran: 0, sin_arqueo: 0, abiertas: 0 };

/**
 * Listado simple de cajas: quién la tuvo, cuánto entró y salió, cuánto debería haber, cuánto se contó en el arqueo
 * y si cuadra. El titular ve todas las cajas de la cuenta (y puede filtrar por responsable); un funcionario, las suyas.
 */
export default function ListarCajas() {
  const [filas, setFilas] = useState<CajaListado[]>([]);
  const [resumen, setResumen] = useState<ResumenCajas>(RESUMEN_VACIO);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [abierta, setAbierta] = useState<number | null>(null);
  const [responsables, setResponsables] = useState<{ clave: string; nombre: string }[]>([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [buscar, setBuscar] = useState('');
  const [buscarAplicado, setBuscarAplicado] = useState('');
  const [estado, setEstado] = useState<FiltrosCajas['estado']>('');
  const [cuadre, setCuadre] = useState<FiltrosCajas['cuadre']>('');
  const [responsable, setResponsable] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  useEffect(() => {
    getResponsablesCajas().then((r) => setResponsables(r.data)).catch(() => setResponsables([]));
  }, []);

  // La búsqueda por texto espera un instante tras escribir para no pedir en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => { setBuscarAplicado(buscar); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [buscar]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const r = await getCajas({ page, limit, estado, cuadre, responsable, desde, hasta, buscar: buscarAplicado });
      setFilas(r.data.data);
      setResumen(r.data.resumen);
      setTotal(r.data.total);
      setTotalPages(r.data.totalPages);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.message || 'No se pudo cargar el listado de cajas');
    } finally {
      setCargando(false);
    }
  }, [page, limit, estado, cuadre, responsable, desde, hasta, buscarAplicado]);

  useEffect(() => { void cargar(); }, [cargar]);
  useAlVolverALaVentana(() => { void cargar(); });

  const cambiar = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  const campo = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white';
  const tarjeta = 'rounded-2xl bg-white p-4 shadow dark:bg-gray-800';

  return (
    <div className="p-4">
      {renderTitle({
        title: 'Cajas',
        subtitle: 'Ingresos, egresos, saldo y si cada caja cuadra, con su responsable',
        icon: <FaCashRegister className="text-white text-3xl sm:text-4xl" />,
      })}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <div className={tarjeta}>
          <p className="text-xs text-gray-500">Cajas</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{total}</p>
          {resumen.abiertas > 0 && <p className="text-xs text-blue-600">{resumen.abiertas} abierta{resumen.abiertas === 1 ? '' : 's'}</p>}
        </div>
        <div className={tarjeta}>
          <p className="text-xs text-gray-500">Ingresos</p>
          <p className="text-xl font-bold text-green-700">₲ {gs(resumen.ingresos)}</p>
        </div>
        <div className={tarjeta}>
          <p className="text-xs text-gray-500">Egresos</p>
          <p className="text-xl font-bold text-red-700">₲ {gs(resumen.egresos)}</p>
        </div>
        <div className={tarjeta}>
          <p className="text-xs text-gray-500">Diferencia de arqueos</p>
          <p className={`text-xl font-bold ${resumen.diferencia_neta === 0 ? 'text-gray-800 dark:text-white' : resumen.diferencia_neta > 0 ? 'text-amber-600' : 'text-red-700'}`}>
            ₲ {gsConSigno(resumen.diferencia_neta)}
          </p>
          <p className="text-xs text-gray-500">sobrante (+) / faltante (−)</p>
        </div>
        <div className={tarjeta}>
          <p className="text-xs text-gray-500">Cuadran</p>
          <p className="text-2xl font-bold text-green-700">{resumen.cuadran}</p>
        </div>
        <div className={tarjeta}>
          <p className="text-xs text-gray-500">No cuadran</p>
          <p className={`text-2xl font-bold ${resumen.no_cuadran > 0 ? 'text-red-700' : 'text-gray-800 dark:text-white'}`}>{resumen.no_cuadran}</p>
          {resumen.sin_arqueo > 0 && <p className="text-xs text-gray-500">{resumen.sin_arqueo} sin arqueo</p>}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow dark:bg-gray-800">
        <div className="relative min-w-[200px] flex-1">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input className={`${campo} w-full pl-9`} placeholder="Nº de caja o responsable…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        </div>
        <select className={campo} value={estado} onChange={(e) => cambiar(setEstado)(e.target.value as FiltrosCajas['estado'])}>
          <option value="">Todas</option>
          <option value="abierta">Abiertas</option>
          <option value="cerrada">Cerradas</option>
        </select>
        <select className={campo} value={cuadre} onChange={(e) => cambiar(setCuadre)(e.target.value as FiltrosCajas['cuadre'])}>
          <option value="">Cuadre: todos</option>
          <option value="cuadra">Cuadran</option>
          <option value="no_cuadra">No cuadran</option>
          <option value="faltante">Con faltante</option>
          <option value="sobrante">Con sobrante</option>
          <option value="sin_arqueo">Sin arqueo</option>
        </select>
        {responsables.length > 1 && (
          <select className={campo} value={responsable} onChange={(e) => cambiar(setResponsable)(e.target.value)}>
            <option value="">Todos los responsables</option>
            {responsables.map((r) => <option key={r.clave} value={r.clave}>{r.nombre}</option>)}
          </select>
        )}
        <label className="text-xs text-gray-500">Desde
          <input type="date" className={`${campo} ml-1`} value={desde} onChange={(e) => cambiar(setDesde)(e.target.value)} />
        </label>
        <label className="text-xs text-gray-500">Hasta
          <input type="date" className={`${campo} ml-1`} value={hasta} onChange={(e) => cambiar(setHasta)(e.target.value)} />
        </label>
        <select className={campo} value={limit} onChange={(e) => cambiar(setLimit)(Number(e.target.value))}>
          {[10, 20, 50].map((n) => <option key={n} value={n}>{n} por página</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow dark:bg-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr className="text-left text-gray-600 dark:text-gray-300">
              <th className="px-3 py-3 font-semibold">Caja</th>
              <th className="px-3 py-3 font-semibold">Responsable</th>
              <th className="px-3 py-3 font-semibold">Apertura</th>
              <th className="px-3 py-3 text-right font-semibold">Ingresos</th>
              <th className="px-3 py-3 text-right font-semibold">Egresos</th>
              <th className="px-3 py-3 text-right font-semibold" title="Efectivo que debería haber en la caja">Efectivo</th>
              <th className="px-3 py-3 text-right font-semibold">Contado</th>
              <th className="px-3 py-3 text-right font-semibold">Diferencia</th>
              <th className="px-3 py-3 font-semibold">Estado</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {!cargando && filas.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-500">No hay cajas con esos filtros.</td></tr>
            )}
            {cargando && filas.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-500">Cargando…</td></tr>
            )}
            {filas.map((c) => {
              const est = ESTADO_CUADRE[c.cuadre];
              const abiertaFila = abierta === c.idmovimiento;
              return (
                <Fragment key={c.idmovimiento}>
                  <tr className="cursor-pointer text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/40" onClick={() => setAbierta(abiertaFila ? null : c.idmovimiento)}>
                    <td className="px-3 py-3 font-bold">Nº {c.num_caja}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{c.responsable}</p>
                      <p className="text-xs text-gray-500">{c.rol}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs">
                      {fechaHora(c.fecha_apertura)}
                      {c.fecha_cierre && <p className="text-gray-500">cierre {fechaHora(c.fecha_cierre)}</p>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-green-700">{gs(c.ingresos)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-red-700">{gs(c.egresos)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-bold">{gs(c.saldo)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">{c.contado_arqueo === null ? '—' : gs(c.contado_arqueo)}</td>
                    <td className={`whitespace-nowrap px-3 py-3 text-right font-bold ${c.diferencia === null || c.diferencia === 0 ? 'text-gray-500' : c.diferencia > 0 ? 'text-amber-600' : 'text-red-700'}`}>
                      {c.diferencia === null ? '—' : gsConSigno(c.diferencia)}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${est.clase}`}>{est.texto}</span>
                    </td>
                    <td className="px-2 text-gray-400">{abiertaFila ? <FaChevronUp /> : <FaChevronDown />}</td>
                  </tr>
                  {abiertaFila && (
                    <tr className="bg-gray-50 dark:bg-gray-900/40">
                      <td colSpan={10} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
                          <div><p className="text-xs text-gray-500">Monto de apertura</p><p className="font-semibold">{gs(c.monto_apertura)}</p></div>
                          <div><p className="text-xs text-gray-500">Ventas ({c.ventas})</p><p className="font-semibold">{gs(c.ventas_contado)} contado</p></div>
                          <div><p className="text-xs text-gray-500">Cobros de deuda</p><p className="font-semibold">{gs(c.cobros)}</p></div>
                          <div><p className="text-xs text-gray-500">Compras pagadas</p><p className="font-semibold">{gs(c.compras)}</p></div>
                          <div><p className="text-xs text-gray-500">Otros ingresos</p><p className="font-semibold">{gs(Math.max(c.ingresos - c.ventas_contado - c.cobros, 0))}</p></div>
                          <div><p className="text-xs text-gray-500">Otros egresos</p><p className="font-semibold">{gs(Math.max(c.egresos - c.compras, 0))}</p></div>
                          <div><p className="text-xs text-gray-500">Transferencia / tarjeta / cheque</p><p className="font-semibold">{gsConSigno(c.otros_medios)}</p></div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          El cuadre se hace sobre el efectivo (apertura + ingresos en efectivo − egresos en efectivo): lo cobrado por transferencia, tarjeta o cheque no está en el cajón.
                          {!c.cuadre_en_efectivo && ' Esta caja se cerró antes de ese criterio y se comparó contra todos los medios.'}
                        </p>
                        {c.modificada_tras_cierre && (
                          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Después del cierre se anuló o cargó algún movimiento: el saldo cerrado ya no coincide con los movimientos actuales de esta caja.
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg bg-white px-4 py-2 shadow disabled:opacity-40 dark:bg-gray-800">Anterior</button>
        <span>Página {page} de {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg bg-white px-4 py-2 shadow disabled:opacity-40 dark:bg-gray-800">Siguiente</button>
      </div>

      <ModalError isOpen={!!error} onClose={() => setError('')} message={error} />
    </div>
  );
}
