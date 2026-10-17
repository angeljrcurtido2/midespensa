'use client';

import { useMemo } from 'react';
import { FaCalculator, FaInfoCircle } from 'react-icons/fa';
import type { ModalidadSalario } from '../../services/rrhh';

interface VistaPreviaSalarioProps {
  salarioBase: number | string;
  modalidad: ModalidadSalario;
  jornadaHoras: number | string;
  diasMes: number | string;
}

const formatGs = (n: number) =>
  Number.isFinite(n) ? `${Math.round(n).toLocaleString('es-PY')} Gs` : '--';

/**
 * Traduce el monto cargado a los valores con los que después se va a liquidar.
 *
 * Se comparte entre crear y editar porque en ambas pantallas la pregunta del
 * usuario es la misma —"¿cuánto termina cobrando?"— y tener dos copias de la
 * fórmula es justamente lo que llevó a que el cálculo viejo se desviara de la
 * realidad sin que nadie lo notara.
 *
 * Es sólo informativo: el número que se guarda lo calcula el backend.
 */
const VistaPreviaSalario = ({
  salarioBase,
  modalidad,
  jornadaHoras,
  diasMes,
}: VistaPreviaSalarioProps) => {
  const derivados = useMemo(() => {
    const base = Number(salarioBase) || 0;
    const jornada = Number(jornadaHoras) || 8;
    const dias = Number(diasMes) || 30;
    if (!base) return null;

    let valorHora = 0;
    let valorDia = 0;
    switch (modalidad) {
      case 'Hora':
        valorHora = base;
        valorDia = base * jornada;
        break;
      case 'Jornal':
        valorHora = base / jornada;
        valorDia = base;
        break;
      case 'Quincenal':
        valorHora = base / 15 / jornada;
        valorDia = base / 15;
        break;
      default:
        valorHora = base / dias / jornada;
        valorDia = base / dias;
    }

    return {
      valorHora,
      valorDia,
      horaExtraDiurna: valorHora * 1.5,
      horaExtraNocturna: valorHora * 2,
      equivalenteMensual:
        modalidad === 'Hora' ? base * jornada * dias
          : modalidad === 'Jornal' ? base * dias
            : modalidad === 'Quincenal' ? base * 2
              : base,
    };
  }, [salarioBase, modalidad, jornadaHoras, diasMes]);

  if (!derivados) return null;

  return (
    <div className="rounded-xl border-2 border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <FaCalculator className="text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm">
          Así se va a liquidar
        </h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Valor hora', valor: derivados.valorHora },
          { label: 'Valor día', valor: derivados.valorDia },
          { label: 'Hora extra diurna (+50%)', valor: derivados.horaExtraDiurna },
          { label: 'Hora extra nocturna (+100%)', valor: derivados.horaExtraNocturna },
        ].map((d) => (
          <div key={d.label} className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">{d.label}</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {formatGs(d.valor)}
            </p>
          </div>
        ))}
      </div>

      {modalidad !== 'Mensual' && (
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-3 flex items-start gap-1.5">
          <FaInfoCircle className="mt-0.5 shrink-0" />
          Equivale a {formatGs(derivados.equivalenteMensual)} por mes completo.
          {(modalidad === 'Jornal' || modalidad === 'Hora') &&
            ' Se paga según las asistencias registradas en el período.'}
        </p>
      )}
    </div>
  );
};

export default VistaPreviaSalario;
