'use client';

import { useEffect, useState } from 'react';
import { FaCashRegister, FaArrowDown, FaArrowUp, FaCreditCard } from 'react-icons/fa';
import { useCajasEnVivo, type EstadoConexion } from '../../../hooks/useCajasEnVivo';
import type { CajaEnVivo, MovimientoEnVivo } from '../../../services/cajasEnVivo';
import { formatPY } from '../../utils/utils';
import { renderTitle } from '../../../clientes/utils/utils';

const hace = (iso: string | null, ahora: number) => {
  if (!iso) return 'sin movimientos';
  const seg = Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 1000));
  if (seg < 10) return 'ahora mismo';
  if (seg < 60) return `hace ${seg} s`;
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.floor(h / 24)} d`;
};

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const ESTADO: Record<EstadoConexion, { texto: string; clase: string }> = {
  conectando: { texto: 'Conectando…', clase: 'bg-gray-400' },
  en_vivo: { texto: 'En vivo', clase: 'bg-green-500 animate-pulse' },
  reconectando: { texto: 'Reconectando… (se actualiza cada 20 s)', clase: 'bg-amber-500' },
  sin_permiso: { texto: 'Sin acceso', clase: 'bg-red-500' },
};

const Dato = ({ etiqueta, valor, clase = '' }: { etiqueta: string; valor: string; clase?: string }) => (
  <div>
    <p className="text-xs text-gray-500 dark:text-gray-400">{etiqueta}</p>
    <p className={`text-sm font-bold text-gray-800 dark:text-gray-100 ${clase}`}>{valor}</p>
  </div>
);

const TarjetaCaja = ({ c, ahora, resaltada }: { c: CajaEnVivo; ahora: number; resaltada: boolean }) => {
  const abierta = c.estado === 'abierto';
  return (
    <div
      data-testid={`caja-${c.idmovimiento}`}
      className={`rounded-2xl border-2 p-4 transition-all duration-500 ${
        resaltada ? 'border-green-400 bg-green-50 dark:bg-green-900/20 shadow-lg' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      } ${abierta ? '' : 'opacity-70'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{c.responsable}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Caja {c.num_caja} · abierta {new Date(c.fecha_apertura).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${abierta ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
          {abierta ? 'ABIERTA' : 'CERRADA'}
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-blue-50 dark:bg-gray-700 px-4 py-3">
        <p className="text-xs text-blue-700 dark:text-blue-200">Efectivo que debería haber</p>
        <p className="text-2xl font-extrabold text-blue-900 dark:text-white">{formatPY(c.saldo)}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Dato etiqueta="Apertura" valor={formatPY(c.monto_apertura)} />
        <Dato etiqueta="Ingresos" valor={formatPY(c.ingresos)} clase="text-green-700 dark:text-green-400" />
        <Dato etiqueta="Egresos" valor={formatPY(c.egresos)} clase="text-red-700 dark:text-red-400" />
        <Dato etiqueta="Ventas contado" valor={formatPY(c.contado)} />
        <Dato etiqueta="Cobros de deuda" valor={formatPY(c.cobrado)} />
        <Dato etiqueta="Ventas a crédito" valor={formatPY(c.credito)} />
      </div>

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {c.cant_movimientos} movimientos · último: {hace(c.ultimo_movimiento, ahora)}
      </p>
    </div>
  );
};

const FilaMovimiento = ({ m, ahora }: { m: MovimientoEnVivo; ahora: number }) => {
  const entra = m.tipo === 'ingreso';
  const credito = m.tipo === 'venta_credito';
  const Icono = credito ? FaCreditCard : entra ? FaArrowUp : FaArrowDown;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 px-3 py-2">
      <span className={`rounded-lg p-2 ${credito ? 'bg-amber-100 text-amber-700' : entra ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        <Icono size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{m.concepto}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {m.responsable} · caja {m.num_caja} · {hace(m.created_at, ahora)}
        </p>
      </div>
      <p className={`whitespace-nowrap text-sm font-bold ${credito ? 'text-amber-700' : entra ? 'text-green-700' : 'text-red-700'}`}>
        {entra || credito ? '' : '− '}
        {formatPY(m.monto)}
      </p>
    </li>
  );
};

export default function CajasEnVivo() {
  const { datos, error, conexion, eventos, resaltadas } = useCajasEnVivo();
  const [ahora, setAhora] = useState(Date.now());

  // Reloj para que los "hace 5 s" avancen sin volver a pedir datos.
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const abiertas = datos?.cajas.filter((c) => c.estado === 'abierto') ?? [];
  const cerradas = datos?.cajas.filter((c) => c.estado !== 'abierto') ?? [];
  const estado = ESTADO[conexion];
  const totalSaldo = abiertas.reduce((a, c) => a + c.saldo, 0);

  return (
    <div className="p-4">
      {renderTitle({
        title: 'Cajas en vivo',
        subtitle: 'Mirá lo que mueven tus funcionarios en cada caja, al instante',
        icon: <FaCashRegister size={28} />,
      })}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200" data-testid="estado-conexion">
          <span className={`inline-block h-3 w-3 rounded-full ${estado.clase}`} />
          {estado.texto}
        </div>
        {abiertas.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {abiertas.length} {abiertas.length === 1 ? 'caja abierta' : 'cajas abiertas'} · efectivo esperado total{' '}
            <b>{formatPY(totalSaldo)}</b>
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
      )}

      {!datos && !error && <p className="text-gray-500">Cargando cajas…</p>}

      {datos && abiertas.length === 0 && (
        <div className="mb-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-gray-600 dark:text-gray-300">
          No hay cajas abiertas ahora. Cuando un funcionario abra su caja aparece acá solo.
        </div>
      )}

      {abiertas.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {abiertas.map((c) => (
            <TarjetaCaja key={c.idmovimiento} c={c} ahora={ahora} resaltada={!!resaltadas[c.idmovimiento]} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-lg font-bold text-gray-800 dark:text-gray-100">Últimos movimientos</h2>
          {datos && datos.movimientos.length > 0 ? (
            <ul className="space-y-2" data-testid="lista-movimientos">
              {datos.movimientos.slice(0, 15).map((m) => (
                <FilaMovimiento key={`${m.tipo}-${m.id}`} m={m} ahora={ahora} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Todavía no hay movimientos en estas cajas.</p>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-gray-800 dark:text-gray-100">Actividad en esta sesión</h2>
          {eventos.length > 0 ? (
            <ul className="space-y-2" data-testid="lista-eventos">
              {eventos.map((e, i) => (
                <li key={`${e.ts}-${i}`} className="rounded-xl border border-gray-100 dark:border-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-gray-100">
                  <b>{e.por.nombre}</b> {e.accion}
                  <span className="ml-2 text-xs text-gray-500">{hora(e.ts)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Acá aparece al instante cada cosa que hagan tus funcionarios mientras tengas esta pantalla abierta.</p>
          )}
        </section>
      </div>

      {cerradas.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-bold text-gray-800 dark:text-gray-100">Cerradas en las últimas 24 h</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {cerradas.map((c) => (
              <TarjetaCaja key={c.idmovimiento} c={c} ahora={ahora} resaltada={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
