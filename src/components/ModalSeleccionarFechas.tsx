import React, { useState } from 'react';
import { XMarkIcon, CalendarDaysIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

interface ModalSeleccionarFechasProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerar: (fechaInicio: string, fechaFin: string) => void;
  titulo: string;
  descripcion?: string;
}

const ModalSeleccionarFechas: React.FC<ModalSeleccionarFechasProps> = ({
  isOpen,
  onClose,
  onGenerar,
  titulo,
  descripcion,
}) => {
  // Por defecto: año actual
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split('T')[0]
  );

  const handleGenerar = () => {
    if (!fechaInicio || !fechaFin) {
      alert('Por favor selecciona ambas fechas');
      return;
    }

    if (fechaInicio > fechaFin) {
      alert('La fecha de inicio no puede ser mayor que la fecha de fin');
      return;
    }

    onGenerar(fechaInicio, fechaFin);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md">
        {/* Fondo con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-slate-800/50 dark:via-slate-900/50 dark:to-slate-950/50 rounded-2xl -m-2"></div>

        {/* Contenido principal */}
        <div className="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-blue-100 dark:border-slate-700">

          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 p-6">
            <div className='flex justify-end'>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                  <CalendarDaysIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{titulo}</h2>
                  {descripcion && (
                    <p className="text-sm text-blue-100 mt-1 truncate">{descripcion}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cuerpo del modal */}
          <div className="p-6 space-y-6">

            {/* Formulario */}
            <div className="space-y-4">
              {/* Fecha Inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Inicio
                </label>
                <div className="relative">
                  <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 transition-all bg-white dark:bg-slate-700 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Fecha Fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Fin
                </label>
                <div className="relative">
                  <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 transition-all bg-white dark:bg-slate-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Atajos rápidos */}
            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <RocketLaunchIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Atajos rápidos:</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: 'Hoy',
                    action: () => {
                      const hoy = new Date().toISOString().split('T')[0];
                      setFechaInicio(hoy);
                      setFechaFin(hoy);
                    }
                  },
                  {
                    label: 'Este Mes',
                    action: () => {
                      const hoy = new Date();
                      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
                      const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
                      setFechaInicio(inicio);
                      setFechaFin(fin);
                    }
                  },
                  {
                    label: 'Este Año',
                    action: () => {
                      const hoy = new Date();
                      const inicio = new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0];
                      const fin = new Date(hoy.getFullYear(), 11, 31).toISOString().split('T')[0];
                      setFechaInicio(inicio);
                      setFechaFin(fin);
                    }
                  },
                  {
                    label: 'Año Pasado',
                    action: () => {
                      const hoy = new Date();
                      const inicio = new Date(hoy.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
                      const fin = new Date(hoy.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
                      setFechaInicio(inicio);
                      setFechaFin(fin);
                    }
                  }
                ].map((atajo) => (
                  <button
                    key={atajo.label}
                    onClick={atajo.action}
                    className="px-3 py-2 text-sm bg-gradient-to-r from-gray-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 hover:from-gray-100 hover:to-slate-200 dark:hover:from-slate-600 dark:hover:to-slate-700 text-gray-700 dark:text-gray-200 rounded-lg transition-all duration-200 font-medium border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm"
                  >
                    {atajo.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 hover:from-gray-300 hover:to-slate-400 dark:hover:from-slate-500 dark:hover:to-slate-600 text-gray-700 dark:text-gray-100 rounded-xl transition-all duration-200 font-semibold shadow-sm hover:shadow"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerar}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <CalendarDaysIcon className="h-5 w-5" />
                Generar Reporte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalSeleccionarFechas;