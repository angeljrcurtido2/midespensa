'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  FaArrowDown,
  FaArrowUp,
  FaBalanceScale,
  FaExchangeAlt,
  FaInfoCircle,
  FaRobot,
} from 'react-icons/fa';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getDetalleFlujo,
  getResumenFlujo,
  type CategoriaFlujo,
  type MovimientoDetalle,
  type PuntoSerie,
  type ResumenFlujoResponse,
} from '../../../services/resumenFlujo';
import { formatPY } from '../../utils/utils';
import { renderTitle } from '../../../clientes/utils/utils';
import SearchActionsBar from '../../../components/SearchActionsBar';
import SelectPage from '../../../components/SelectPage';
import SelectPagination from '../../../components/SelectPagination';
import ButtonGral from '../../../components/ButtonGral';

// Fecha en formato YYYY-MM-DD tomando el día LOCAL. Con toISOString() el
// resultado se pasa a UTC y en Paraguay (UTC-3) "hoy" salta al día siguiente
// después de las 21:00, que hacía que el preset Hoy no trajera nada.
const iso = (d: Date) => {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};

// Rangos rápidos: cubren el 90% de las consultas reales sin tocar el calendario.
const hoyISO = () => iso(new Date());

const rangoPreset = (preset: string): { desde: string; hasta: string } => {
  const hoy = new Date();

  switch (preset) {
    case 'hoy':
      return { desde: iso(hoy), hasta: iso(hoy) };
    case 'semana': {
      const d = new Date(hoy);
      d.setDate(d.getDate() - 6);
      return { desde: iso(d), hasta: iso(hoy) };
    }
    case 'mes':
      return {
        desde: iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
        hasta: iso(hoy),
      };
    case 'mesPasado': {
      const ini = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      return { desde: iso(ini), hasta: iso(fin) };
    }
    case 'anio':
      return {
        desde: iso(new Date(hoy.getFullYear(), 0, 1)),
        hasta: iso(hoy),
      };
    default:
      return { desde: '', hasta: '' };
  }
};

const PRESETS = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: '7 días' },
  { key: 'mes', label: 'Este mes' },
  { key: 'mesPasado', label: 'Mes pasado' },
  { key: 'anio', label: 'Este año' },
];

// Etiqueta legible del período según la agrupación que decidió el backend.
const formatPeriodo = (periodo: string, agrupacion: 'dia' | 'mes') => {
  if (agrupacion === 'mes') {
    const [anio, mes] = periodo.split('-');
    const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${nombres[Number(mes) - 1] ?? mes} ${anio}`;
  }
  const [, mes, dia] = periodo.split('-');
  return `${dia}/${mes}`;
};

const formatFecha = (fecha: string) =>
  fecha ? new Date(fecha).toLocaleDateString('es-PY') : '--';

export default function ResumenIngresosEgresos() {
  const inicial = rangoPreset('mes');
  const [fechaDesde, setFechaDesde] = useState(inicial.desde);
  const [fechaHasta, setFechaHasta] = useState(inicial.hasta);
  const [presetActivo, setPresetActivo] = useState('mes');

  // Se guarda lo EXCLUIDO, no lo incluido: así una categoría nueva entra sola
  // al total en vez de quedar invisible hasta que alguien la tilde.
  const [ingresosExcluidos, setIngresosExcluidos] = useState<number[]>([]);
  const [egresosExcluidos, setEgresosExcluidos] = useState<number[]>([]);

  // Contar o no el fondo de apertura de cada caja como ingreso. Cada cliente decide; se recuerda en este navegador.
  const [incluirApertura, setIncluirApertura] = useState<boolean>(() => {
    try { return localStorage.getItem('flujo:incluirApertura') === '1'; } catch { return false; }
  });
  const cambiarApertura = (v: boolean) => {
    setIncluirApertura(v);
    setPage(1);
    try { localStorage.setItem('flujo:incluirApertura', v ? '1' : '0'); } catch { /* sin almacenamiento */ }
  };

  const [resumen, setResumen] = useState<ResumenFlujoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detalle, setDetalle] = useState<MovimientoDetalle[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const filtrosBase = useMemo(
    () => ({
      fechaDesde,
      fechaHasta,
      tiposIngresoExcluidos: ingresosExcluidos,
      tiposEgresoExcluidos: egresosExcluidos,
      incluirApertura,
    }),
    [fechaDesde, fechaHasta, ingresosExcluidos, egresosExcluidos, incluirApertura]
  );

  const fetchResumen = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getResumenFlujo(filtrosBase);
      setResumen(data);
    } catch (err) {
      console.error('Error al obtener resumen de flujo:', err);
      setError('No se pudo cargar el resumen. Verificá la conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [filtrosBase]);

  const fetchDetalle = useCallback(async () => {
    if (!mostrarDetalle) return;
    setLoadingDetalle(true);
    try {
      const { data } = await getDetalleFlujo({ ...filtrosBase, page, limit, search });
      setDetalle(data.data);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
    } catch (err) {
      console.error('Error al obtener detalle de flujo:', err);
    } finally {
      setLoadingDetalle(false);
    }
  }, [filtrosBase, page, limit, search, mostrarDetalle]);

  useEffect(() => {
    fetchResumen();
  }, [fetchResumen]);

  useEffect(() => {
    fetchDetalle();
  }, [fetchDetalle]);

  const aplicarPreset = (key: string) => {
    const { desde, hasta } = rangoPreset(key);
    setFechaDesde(desde);
    setFechaHasta(hasta);
    setPresetActivo(key);
    setPage(1);
  };

  const toggleCategoria = (tipo: 'ingreso' | 'egreso', idtipo: number) => {
    const setter = tipo === 'ingreso' ? setIngresosExcluidos : setEgresosExcluidos;
    setter((prev) =>
      prev.includes(idtipo) ? prev.filter((id) => id !== idtipo) : [...prev, idtipo]
    );
    setPage(1);
  };

  const limpiarExclusiones = () => {
    setIngresosExcluidos([]);
    setEgresosExcluidos([]);
    setPage(1);
  };

  const totales = resumen?.totales;
  const neto = totales?.neto ?? 0;
  const positivo = neto >= 0;
  const hayExclusiones = ingresosExcluidos.length > 0 || egresosExcluidos.length > 0;

  const datosGrafico = useMemo(
    () =>
      (resumen?.serie ?? []).map((p: PuntoSerie) => ({
        ...p,
        etiqueta: formatPeriodo(p.periodo, resumen?.agrupacion ?? 'dia'),
      })),
    [resumen]
  );

  // Barra de proporción: hace ver de un vistazo cuánto del ingreso se consume
  // en egresos, que es la lectura que más rápido interpreta el usuario.
  const totalBarra = (totales?.totalIngresos ?? 0) + (totales?.totalEgresos ?? 0);
  const pctIngresos = totalBarra ? ((totales?.totalIngresos ?? 0) / totalBarra) * 100 : 0;

  const renderCategorias = (
    items: CategoriaFlujo[],
    tipo: 'ingreso' | 'egreso'
  ) => {
    if (!items.length) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          Sin movimientos en este rango
        </p>
      );
    }

    const totalActivo = items
      .filter((i) => !i.excluido)
      .reduce((acc, i) => acc + i.total, 0);

    return (
      <div className="space-y-2">
        {items.map((cat) => {
          const pct = totalActivo && !cat.excluido ? (cat.total / totalActivo) * 100 : 0;
          return (
            <button
              key={`${tipo}-${cat.idtipo}`}
              onClick={() => (cat.idtipo === 0 ? cambiarApertura(false) : toggleCategoria(tipo, cat.idtipo))}
              title={cat.idtipo === 0 ? 'Click para dejar de contar la apertura' : cat.excluido ? 'Click para incluir en el total' : 'Click para excluir del total'}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                cat.excluido
                  ? 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/40 opacity-60'
                  : tipo === 'ingreso'
                  ? 'border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10 hover:border-emerald-300'
                  : 'border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-900/10 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold truncate ${
                      cat.excluido
                        ? 'text-gray-500 line-through dark:text-gray-400'
                        : 'text-gray-800 dark:text-gray-100'
                    }`}
                  >
                    {cat.descripcion}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {cat.cantidad} {cat.cantidad === 1 ? 'registro' : 'registros'}
                    {cat.excluido && ' · excluido del total'}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold whitespace-nowrap ${
                    cat.excluido
                      ? 'text-gray-400'
                      : tipo === 'ingreso'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatPY(cat.total)}
                </span>
              </div>

              {!cat.excluido && (
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      tipo === 'ingreso' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8"
      style={{ scrollbarGutter: 'stable' }}
    >
      <div className="max-w-7xl mx-auto">
        {renderTitle({
          title: 'Ingresos y Egresos',
          subtitle: 'Cuánto entra y cuánto sale en el período que elijas',
          icon: <FaExchangeAlt className="text-white text-3xl sm:text-4xl" />,
        })}

        <SearchActionsBar
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
            setMostrarDetalle(true);
          }}
          searchPlaceholder="Buscar en el detalle por concepto o categoría..."
          extraContent={
            <div className="space-y-4">
              {/* Rangos rápidos */}
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => aplicarPreset(p.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                      presetActivo === p.key
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={incluirApertura}
                  onChange={(e) => cambiarApertura(e.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  Contar la apertura de caja como ingreso
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Es el dinero con el que arranca cada caja. Apagado, el total muestra solo lo que entró vendiendo o cobrando.
                  </span>
                </span>
              </label>

              {/* Rango manual */}
              <div className="flex flex-wrap gap-4">
                {[
                  { label: 'Fecha desde', value: fechaDesde, setter: setFechaDesde },
                  { label: 'Fecha hasta', value: fechaHasta, setter: setFechaHasta },
                ].map(({ label, value, setter }) => (
                  <div key={label} className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                      {label}
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        value={value}
                        max={hoyISO()}
                        onChange={(e) => {
                          setter(e.target.value);
                          setPresetActivo('');
                          setPage(1);
                        }}
                        className="w-full pl-10 pr-8 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:border-blue-500 transition-all text-sm"
                      />
                      {value && (
                        <button
                          onClick={() => {
                            setter('');
                            setPresetActivo('');
                            setPage(1);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <ButtonGral
            text={mostrarDetalle ? 'Ocultar detalle' : 'Ver detalle'}
            onClick={() => setMostrarDetalle((v) => !v)}
          />
          {hayExclusiones && (
            <ButtonGral text="Mostrar todas las categorías" onClick={limpiarExclusiones} />
          )}
          {mostrarDetalle && <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />}
        </SearchActionsBar>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
          </div>
        )}

        {!loading && resumen && (
          <>
            {/* Tarjetas de totales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-emerald-100 dark:border-emerald-900/40 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-emerald-500 p-2.5 rounded-lg">
                    <FaArrowDown className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Ingresos
                    </p>
                    <p className="text-xs text-gray-400">
                      {totales?.cantIngresos ?? 0} registros
                    </p>
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-emerald-600 dark:text-emerald-400 break-words">
                  {formatPY(totales?.totalIngresos ?? 0)}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-rose-100 dark:border-rose-900/40 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-rose-500 p-2.5 rounded-lg">
                    <FaArrowUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Egresos
                    </p>
                    <p className="text-xs text-gray-400">
                      {totales?.cantEgresos ?? 0} registros
                    </p>
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-rose-600 dark:text-rose-400 break-words">
                  {formatPY(totales?.totalEgresos ?? 0)}
                </p>
              </div>

              <div
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 p-5 ${
                  positivo
                    ? 'border-blue-200 dark:border-blue-900/40'
                    : 'border-amber-300 dark:border-amber-900/40'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-lg ${positivo ? 'bg-blue-600' : 'bg-amber-500'}`}>
                    <FaBalanceScale className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Resultado neto
                    </p>
                    <p className="text-xs text-gray-400">
                      {positivo ? 'Entró más de lo que salió' : 'Salió más de lo que entró'}
                    </p>
                  </div>
                </div>
                <p
                  className={`text-2xl lg:text-3xl font-bold break-words ${
                    positivo
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {positivo ? '+' : ''}
                  {formatPY(neto)}
                </p>
              </div>
            </div>

            {/* Proporción ingresos / egresos */}
            {totalBarra > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 mb-6">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Ingresos {pctIngresos.toFixed(1)}%
                  </span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    Egresos {(100 - pctIngresos).toFixed(1)}%
                  </span>
                </div>
                <div className="flex h-4 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <div className="bg-emerald-500" style={{ width: `${pctIngresos}%` }} />
                  <div className="bg-rose-500" style={{ width: `${100 - pctIngresos}%` }} />
                </div>
              </div>
            )}

            {hayExclusiones && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-start gap-3">
                <FaInfoCircle className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Hay {ingresosExcluidos.length + egresosExcluidos.length} categoría(s) excluida(s)
                  del total. Los montos de arriba no las incluyen.
                </p>
              </div>
            )}

            {/* Gráfico */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  Evolución {resumen.agrupacion === 'mes' ? 'mensual' : 'diaria'}
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {datosGrafico.length} período(s)
                </span>
              </div>

              {datosGrafico.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                  No hay movimientos en este rango de fechas
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <ComposedChart data={datosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="etiqueta" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) =>
                        Math.abs(v) >= 1_000_000
                          ? `${(v / 1_000_000).toFixed(1)}M`
                          : Math.abs(v) >= 1000
                          ? `${(v / 1000).toFixed(0)}K`
                          : String(v)
                      }
                    />
                    <Tooltip
                      formatter={(value, name) => [formatPY(Number(value)), String(name)]}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="egresos" name="Egresos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Line
                      type="monotone"
                      dataKey="neto"
                      name="Neto"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Desglose por categoría */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  Ingresos por categoría
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Tocá una categoría para sacarla o volver a sumarla al total
                </p>
                {renderCategorias(resumen.desglose.ingresos, 'ingreso')}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-1">
                  Egresos por categoría
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Tocá una categoría para sacarla o volver a sumarla al total
                </p>
                {renderCategorias(resumen.desglose.egresos, 'egreso')}
              </div>
            </div>
          </>
        )}

        {/* Detalle unificado */}
        {mostrarDetalle && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Detalle de movimientos
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {totalItems} movimiento(s)
              </span>
            </div>

            {loadingDetalle && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
              </div>
            )}

            {!loadingDetalle && detalle.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No hay movimientos con estos filtros
              </p>
            )}

            {!loadingDetalle && detalle.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-700 text-left">
                        <th className="py-2 px-2 font-semibold text-gray-600 dark:text-gray-300">Fecha</th>
                        <th className="py-2 px-2 font-semibold text-gray-600 dark:text-gray-300">Categoría</th>
                        <th className="py-2 px-2 font-semibold text-gray-600 dark:text-gray-300">Concepto</th>
                        <th className="py-2 px-2 font-semibold text-gray-600 dark:text-gray-300">Origen</th>
                        <th className="py-2 px-2 font-semibold text-gray-600 dark:text-gray-300 text-right">Entrada</th>
                        <th className="py-2 px-2 font-semibold text-gray-600 dark:text-gray-300 text-right">Salida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.map((m) => (
                        <tr
                          key={`${m.movimiento}-${m.id}`}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                        >
                          <td className="py-2 px-2 whitespace-nowrap text-gray-700 dark:text-gray-200">
                            {formatFecha(m.fecha)}
                          </td>
                          <td className="py-2 px-2 text-gray-700 dark:text-gray-200">{m.categoria}</td>
                          <td className="py-2 px-2 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                            {m.concepto || '--'}
                          </td>
                          <td className="py-2 px-2">
                            {m.automatico ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                <FaRobot className="h-3 w-3" /> Automático
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">Manual</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {m.movimiento === 'ingreso' ? formatPY(m.monto) : ''}
                          </td>
                          <td className="py-2 px-2 text-right font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            {m.movimiento === 'egreso' ? formatPY(m.monto) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <SelectPagination page={page} setPage={setPage} totalPages={totalPages} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
