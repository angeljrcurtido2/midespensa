'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import { X, Package } from 'lucide-react';
import AtributosProductos from '../CrearVenta/AtributosProductos';
import type { DetalleProductoResponse } from '../../../services/productoDetalle';

interface ModalSeleccionarAtributoProps {
  isOpen: boolean;
  onClose: () => void;
  idproducto: number;
  nombreProducto: string;
  detalleSeleccionado: DetalleProductoResponse | null;
  onSelectDetalle: (detalle: DetalleProductoResponse | null) => void;
}

const ModalSeleccionarAtributo: React.FC<ModalSeleccionarAtributoProps> = ({
  isOpen,
  onClose,
  idproducto,
  nombreProducto,
  detalleSeleccionado,
  onSelectDetalle,
}) => {
  if (!isOpen) return null;

  const handleSelect = (detalle: DetalleProductoResponse | null) => {
    onSelectDetalle(detalle);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop con efecto blur */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header con gradiente */}
                <div className="relative bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 px-6 py-5">
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
                        <Package className="text-white" size={24} />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-xl font-bold text-white">
                          Seleccionar Atributo
                        </Dialog.Title>
                        <p className="text-sm text-purple-100 mt-0.5 truncate max-w-xs">
                          {nombreProducto}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-lg transition-all duration-200"
                    >
                      <X className="text-white" size={20} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                  <AtributosProductos
                    idproducto={idproducto}
                    nombreProducto={nombreProducto}
                    detalleSeleccionado={detalleSeleccionado}
                    onSelectDetalle={handleSelect}
                  />
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
                    onClick={onClose}
                  >
                    Cerrar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalSeleccionarAtributo;
