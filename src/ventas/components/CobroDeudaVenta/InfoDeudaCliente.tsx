import React from 'react';
import { formatPY } from '../../../movimiento/utils/utils';
import CardText from './components/CardText';

interface InfoDeudaClienteProps {
  deuda: {
    total_creditos: number;
    creditos_pendientes: number;
    creditos_pagados: number;
    total_deuda: number | string;
    total_pagado: number | string;
    saldo: number | string;
    tiene_cuotas?: string;
    total_cuotas?: number;
    cuotas_pendientes?: number;
    cuotas_vencidas?: number;
    cuotas_pagadas_parcial?: number;
    cuotas_pagadas_total?: number;
    proxima_cuota_fecha?: string;
    proxima_cuota_numero?: number;
    proxima_cuota_monto?: number;
    total_interes_punitorio?: number;
  };
}


const InfoDeudaCliente: React.FC<InfoDeudaClienteProps> = ({ deuda }) => {

  const styleCards = "bg-blue-50 dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-gray-700";
  const styleTxtCards = "text-xs font-medium mb-1 text-blue-600 dark:text-gray-300";
  const styleTxtLabel = "text-sm font-bold mb-1 text-blue-700 dark:text-gray-200";
  const styleBadge = "px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-gray-200";

  const cardsData = [
    {
      title: "Total Deuda",
      text: formatPY(deuda.total_deuda),
    },
    {
      title: "Pagado",
      text: formatPY(deuda.total_pagado),
    },
    {
      title: "Saldo",
      text: formatPY(deuda.saldo),
    },
    {
      title: "Cuotas",
      text: deuda.total_cuotas || 0,
    },
    {
      title: "Pendientes",
      text: (deuda.cuotas_pendientes ?? 0) + (deuda.cuotas_vencidas ?? 0),
    }
  ];

  return (
    <>
      {/* Información de Créditos */}
      <div className={styleCards}>
        <p className={styleTxtCards}>Créditos</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-700 dark:text-gray-200">
            Total: <span className="font-bold">{deuda.total_creditos || 0}</span>
          </span>
          <div className="flex gap-2 text-xs">
            <span className={styleBadge}>
              {deuda.creditos_pendientes || 0} Activos
            </span>
            <span className={styleBadge}>
              {deuda.creditos_pagados || 0} Pagados
            </span>
          </div>
        </div>
      </div>

      {/* Información Financiera */}
      <div className="grid grid-cols-3 gap-2">
        {cardsData.map((card, index) => (
          <CardText
            key={index}
            title={card.title}
            text={card.text}
          />
        ))}
        {(deuda.cuotas_vencidas ?? 0) > 0 && (
          <span className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-2 py-1 rounded font-semibold">
            {deuda.cuotas_vencidas} Vencidas
          </span>
        )}

        {(deuda.cuotas_pagadas_parcial ?? 0) > 0 && (
          <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 px-2 py-1 rounded">
            {deuda.cuotas_pagadas_parcial} Parcial
          </span>
        )}

        {deuda.proxima_cuota_fecha && (
          <div
            className={`p-2 rounded-lg border
                ${new Date(deuda.proxima_cuota_fecha) < new Date()
                ? 'bg-red-100 border-red-300 dark:bg-red-900/40 dark:border-red-700'
                : 'bg-blue-100 border-blue-300 dark:bg-gray-700 dark:border-gray-600'
              }`}
          >
            <p className={styleTxtLabel}>
              Próxima cuota
            </p>
            <p className={styleTxtLabel}>
              {new Date(deuda.proxima_cuota_fecha).toLocaleDateString('es-PY')}
            </p>
            <p className={styleTxtLabel}>
              {formatPY(deuda.proxima_cuota_monto || 0)}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default InfoDeudaCliente;
