import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCalendarTimes, FaBoxes, FaShoppingCart } from 'react-icons/fa';
import { PaginaListado, EncabezadoListado, TablaListado, AccionFila, Insignia } from '../../components/listado/Listado';
import InfoFarmaciaProducto from '../../components/InfoFarmaciaProducto';
import { useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';
import {
  getAlertasReposicion,
  getAlertasVencimientos,
  getResumenAlertas,
  type LoteAlertaVencimiento,
  type ProductoAlertaReposicion,
  type ResumenAlertas,
} from '../../services/alertasInventario';

type Pestana = 'vencimientos' | 'reposicion';
const RANGOS = [{ dias: 0, texto: 'Solo vencidos' }, { dias: 30, texto: '30 días' }, { dias: 60, texto: '60 días' }, { dias: 90, texto: '90 días' }, { dias: 180, texto: '6 meses' }];

const fechaCorta = (iso: string) => { const [a, m, d] = iso.split('-'); return `${d}/${m}/${a}`; };

function EstadoVencimiento({ dias }: { dias: number }) {
  if (dias < 0) return <Insignia color="rojo">Vencido hace {Math.abs(dias)} {Math.abs(dias) === 1 ? 'día' : 'días'}</Insignia>;
  if (dias === 0) return <Insignia color="rojo">Vence hoy</Insignia>;
  if (dias <= 30) return <Insignia color="ambar">Vence en {dias} {dias === 1 ? 'día' : 'días'}</Insignia>;
  return <Insignia color="azul">Vence en {dias} días</Insignia>;
}

function TarjetaResumen({ icono, titulo, valor, detalle, color, activa, onClick }: { icono: React.ReactNode; titulo: string; valor: number; detalle: string; color: string; activa: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activa} className={`flex items-center gap-3 rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition hover:shadow-md dark:bg-slate-900 ${activa ? 'border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30' : 'border-slate-200 dark:border-slate-700'}`}>
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl text-white ${color}`} aria-hidden="true">{icono}</span>
      <span>
        <span className="block text-3xl font-extrabold leading-none text-slate-900 dark:text-slate-50">{valor}</span>
        <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">{titulo}</span>
        <span className="block text-xs text-slate-500">{detalle}</span>
      </span>
    </button>
  );
}

/** Alertas de inventario: lotes vencidos o por vencer y productos que hay que reponer. */
export default function AlertasInventario() {
  const navigate = useNavigate();
  const [pestana, setPestana] = useState<Pestana>('vencimientos');
  const [dias, setDias] = useState(60);
  const [venc, setVenc] = useState<LoteAlertaVencimiento[]>([]);
  const [rep, setRep] = useState<ProductoAlertaReposicion[]>([]);
  const [resumen, setResumen] = useState<ResumenAlertas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [v, r, s] = await Promise.all([getAlertasVencimientos(dias), getAlertasReposicion(), getResumenAlertas()]);
      setVenc(v.data.data || []);
      setRep(r.data.data || []);
      setResumen(s.data);
    } catch {
      setError('No se pudieron cargar las alertas. Revisá la conexión e intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  }, [dias]);
  useEffect(() => { void cargar(); }, [cargar]);
  useAlVolverALaVentana(() => { void cargar(); });

  return (
    <PaginaListado>
      <EncabezadoListado icono={<FaBell />} titulo="Alertas de inventario" subtitulo="Lo que vence pronto y lo que hay que reponer" />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <TarjetaResumen icono={<FaCalendarTimes />} titulo="Vencidos" valor={resumen?.vencidos ?? 0} detalle="Lotes vencidos con stock" color="bg-red-600" activa={pestana === 'vencimientos' && dias === 0} onClick={() => { setPestana('vencimientos'); setDias(0); }} />
        <TarjetaResumen icono={<FaCalendarTimes />} titulo="Vencen en 30 días" valor={resumen?.por_vencer_30 ?? 0} detalle={`${resumen?.por_vencer_90 ?? 0} más entre 30 y 90 días`} color="bg-amber-500" activa={pestana === 'vencimientos' && dias === 30} onClick={() => { setPestana('vencimientos'); setDias(30); }} />
        <TarjetaResumen icono={<FaBoxes />} titulo="Para reponer" valor={resumen?.reposicion ?? 0} detalle={`${resumen?.agotados ?? 0} agotados`} color="bg-blue-600" activa={pestana === 'reposicion'} onClick={() => setPestana('reposicion')} />
      </div>

      {error && <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</p>}

      <div role="tablist" aria-label="Tipo de alerta" className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" role="tab" aria-selected={pestana === 'vencimientos'} onClick={() => setPestana('vencimientos')} className={`rounded-xl px-4 py-2 text-sm font-bold ${pestana === 'vencimientos' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50'}`}>Vencimientos ({venc.length})</button>
        <button type="button" role="tab" aria-selected={pestana === 'reposicion'} onClick={() => setPestana('reposicion')} className={`rounded-xl px-4 py-2 text-sm font-bold ${pestana === 'reposicion' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50'}`}>Reposición ({rep.length})</button>
        {pestana === 'vencimientos' && (
          <div className="ml-auto flex flex-wrap items-center gap-1.5" role="group" aria-label="Mostrar lotes que vencen en">
            <span className="text-xs font-semibold text-slate-500">Mostrar:</span>
            {RANGOS.map((r) => (
              <button key={r.dias} type="button" aria-pressed={dias === r.dias} onClick={() => setDias(r.dias)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${dias === r.dias ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50'}`}>{r.texto}</button>
            ))}
          </div>
        )}
      </div>

      {pestana === 'vencimientos' ? (
        <TablaListado
          filas={venc}
          claveFila={(f) => f.idlote}
          cargando={cargando}
          vacio={dias === 0 ? 'No hay lotes vencidos con stock. ¡Todo al día!' : `No hay lotes que venzan en los próximos ${dias} días.`}
          anchoMinimo={760}
          columnas={[
            { clave: 'producto', titulo: 'Producto', render: (f) => <><p className="font-bold text-slate-900 dark:text-slate-100">{f.nombre_producto}</p><InfoFarmaciaProducto producto={f} /></> },
            { clave: 'lote', titulo: 'Lote', sinSalto: true, render: (f) => <span className="font-mono text-xs">{f.numero_lote}</span> },
            { clave: 'vence', titulo: 'Vence', sinSalto: true, render: (f) => fechaCorta(f.fecha_vencimiento) },
            { clave: 'estado', titulo: 'Estado', sinSalto: true, render: (f) => <EstadoVencimiento dias={f.dias} /> },
            { clave: 'stock', titulo: 'Stock del lote', alinear: 'right', sinSalto: true, render: (f) => `${f.stock_actual} ${String(f.unidad_medida || '').toLowerCase()}` },
          ]}
          acciones={(f) => <AccionFila icono={<FaBoxes />} texto="Ver producto" tipo="neutra" onClick={() => navigate(`/productos/editar/${f.idproducto}`)} />}
        />
      ) : (
        <TablaListado
          filas={rep}
          claveFila={(f) => f.idproducto}
          cargando={cargando}
          vacio="Ningún producto está por debajo de su stock mínimo. Para recibir avisos, cargá el «Stock mínimo» en cada producto."
          anchoMinimo={720}
          columnas={[
            { clave: 'producto', titulo: 'Producto', render: (f) => <><p className="font-bold text-slate-900 dark:text-slate-100">{f.nombre_producto}</p><InfoFarmaciaProducto producto={f} /></> },
            { clave: 'stock', titulo: 'Stock', alinear: 'right', sinSalto: true, render: (f) => <Insignia color={f.agotado ? 'rojo' : 'ambar'}>{f.agotado ? 'Agotado' : f.stock}</Insignia> },
            { clave: 'min', titulo: 'Mínimo', alinear: 'right', sinSalto: true, render: (f) => f.stock_minimo },
            { clave: 'faltan', titulo: 'Faltan para llegar al mínimo', alinear: 'right', sinSalto: true, render: (f) => <strong>{f.faltan}</strong> },
          ]}
          acciones={(f) => (
            <>
              <AccionFila icono={<FaShoppingCart />} texto="Comprar" onClick={() => navigate('/compras/nueva')} />
              <AccionFila icono={<FaBoxes />} texto="Ver producto" tipo="neutra" onClick={() => navigate(`/productos/editar/${f.idproducto}`)} />
            </>
          )}
        />
      )}
    </PaginaListado>
  );
}
