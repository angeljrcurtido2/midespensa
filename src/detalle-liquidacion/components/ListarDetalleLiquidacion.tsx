'use client';

import { useState } from 'react';
import { FaListAlt } from 'react-icons/fa';
import GestionDetalleLiquidacion from '../../liquidaciones/components/GestionDetalleLiquidacion';

const ListarDetalleLiquidacion = () => {
  const [idliquidacionInput, setIdliquidacionInput] = useState('');
  const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8"
      style={{ scrollbarGutter: 'stable' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shrink-0">
              <FaListAlt className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Detalle de Liquidacion</h1>
              <p className="text-sm text-blue-100">Consulta y gestiona conceptos de una liquidacion puntual</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="number"
              min="1"
              value={idliquidacionInput}
              onChange={(e) => setIdliquidacionInput(e.target.value)}
              placeholder="Ingrese ID de liquidacion"
              className="border-2 border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
            />
            <button
              onClick={() => setIdSeleccionado(idliquidacionInput ? Number(idliquidacionInput) : null)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 font-semibold"
            >
              Cargar Detalles
            </button>
          </div>
        </div>

        {idSeleccionado ? (
          <GestionDetalleLiquidacion idliquidacion={idSeleccionado} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-300 shadow">
            Cargue un ID de liquidacion para ver el detalle.
          </div>
        )}
      </div>
    </div>
  );
};

export default ListarDetalleLiquidacion;
