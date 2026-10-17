'use client';

import { NumericFormat } from 'react-number-format';
import { FaShieldAlt } from 'react-icons/fa';
import type { LimitesOperativos } from '../../services/accesos';

interface PanelLimitesProps {
  limites: Partial<LimitesOperativos>;
  onChange: (limites: Partial<LimitesOperativos>) => void;
  readOnly?: boolean;
}

const INTERRUPTORES: { clave: keyof LimitesOperativos; label: string; ayuda: string }[] = [
  {
    clave: 'puede_vender_credito',
    label: 'Vender a crédito',
    ayuda: 'Puede generar ventas con deuda del cliente',
  },
  {
    clave: 'puede_anular_venta',
    label: 'Anular ventas',
    ayuda: 'Puede dar de baja ventas ya registradas',
  },
  {
    clave: 'puede_abrir_caja',
    label: 'Abrir y cerrar caja',
    ayuda: 'Puede iniciar y cerrar el turno de caja',
  },
  {
    clave: 'requiere_autorizacion',
    label: 'Requiere autorización',
    ayuda: 'Sus operaciones fuera de límite necesitan visto bueno',
  },
];

/**
 * Límites operativos: responden una pregunta distinta a la de los permisos.
 * El permiso dice a qué módulo entra; el límite, hasta dónde puede llegar
 * adentro. Se puede tener acceso a ventas y aun así no poder anularlas ni
 * superar cierto monto.
 */
const PanelLimites = ({ limites, onChange, readOnly = false }: PanelLimitesProps) => {
  const set = (clave: keyof LimitesOperativos, valor: unknown) => {
    if (readOnly) return;
    onChange({ ...limites, [clave]: valor });
  };

  const inputClass =
    'border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-all w-full disabled:opacity-50';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FaShieldAlt className="text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Límites operativos</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Monto máximo por venta
          </label>
          <NumericFormat
            value={limites.monto_max_venta ?? ''}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={0}
            allowNegative={false}
            disabled={readOnly}
            onValueChange={(v) => set('monto_max_venta', v.value === '' ? null : Number(v.value))}
            className={inputClass}
            prefix="Gs. "
            placeholder="Sin límite"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Dejalo vacío para no poner tope
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Descuento máximo
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              disabled={readOnly}
              value={limites.descuento_max_pct ?? ''}
              onChange={(e) =>
                set('descuento_max_pct', e.target.value === '' ? null : Number(e.target.value))
              }
              className={inputClass}
              placeholder="Sin límite"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Porcentaje máximo que puede descontar
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {INTERRUPTORES.map((i) => {
          const activo = !!limites[i.clave];
          return (
            <button
              key={i.clave}
              type="button"
              disabled={readOnly}
              onClick={() => set(i.clave, !activo)}
              className={`p-3 rounded-lg border-2 text-left transition-all disabled:opacity-60 ${
                activo
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`text-sm font-semibold ${
                    activo
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {i.label}
                </p>
                {/* Interruptor visual: el estado se lee sin tener que
                    interpretar el color del borde. */}
                <span
                  className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-all shrink-0 ${
                    activo ? 'bg-emerald-500 justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white block" />
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{i.ayuda}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PanelLimites;
