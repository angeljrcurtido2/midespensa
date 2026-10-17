'use client';

import type { ReactNode } from 'react';

export interface OpcionSelector<T extends string> {
  valor: T;
  label: string;
  /** Línea chica debajo del título: para qué sirve o qué implica la opción. */
  ayuda?: string;
  icono?: ReactNode;
}

interface SelectorOpcionesProps<T extends string> {
  label?: string;
  opciones: OpcionSelector<T>[];
  valor: T;
  onChange: (valor: T) => void;
  /** Columnas en pantalla ancha; en móvil siempre son 2. */
  columnas?: 2 | 3 | 4;
  /** Color del estado activo, según lo que represente la opción. */
  tono?: 'azul' | 'verde' | 'rojo';
}

const TONOS = {
  azul: {
    activo: 'border-blue-600 bg-blue-50 dark:bg-blue-900/30',
    texto: 'text-blue-700 dark:text-blue-300',
    hover: 'hover:border-blue-300',
  },
  verde: {
    activo: 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
    texto: 'text-emerald-700 dark:text-emerald-300',
    hover: 'hover:border-emerald-300',
  },
  rojo: {
    activo: 'border-rose-600 bg-rose-50 dark:bg-rose-900/30',
    texto: 'text-rose-700 dark:text-rose-300',
    hover: 'hover:border-rose-300',
  },
};

const COLUMNAS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
};

/**
 * Grupo de opciones en tarjetas, en lugar de un `<select>`.
 *
 * Un desplegable esconde las alternativas y su significado; acá las opciones
 * están todas a la vista con una línea que explica qué implica cada una, que es
 * lo que evita elegir mal sin darse cuenta. Se usa para modalidad de salario,
 * tipo de hora extra, estado de asistencia y tipo de liquidación.
 */
const SelectorOpciones = <T extends string>({
  label,
  opciones,
  valor,
  onChange,
  columnas = 4,
  tono = 'azul',
}: SelectorOpcionesProps<T>) => {
  const estilo = TONOS[tono];

  return (
    <div>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          {label}
        </label>
      )}
      <div className={`grid grid-cols-2 ${COLUMNAS[columnas]} gap-2`}>
        {opciones.map((o) => {
          const activo = valor === o.valor;
          return (
            <button
              key={o.valor}
              type="button"
              onClick={() => onChange(o.valor)}
              aria-pressed={activo}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                activo
                  ? estilo.activo
                  : `border-gray-200 dark:border-gray-600 ${estilo.hover}`
              }`}
            >
              <div className="flex items-center gap-2">
                {o.icono}
                <p
                  className={`text-sm font-semibold ${
                    activo ? estilo.texto : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {o.label}
                </p>
              </div>
              {o.ayuda && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{o.ayuda}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SelectorOpciones;
