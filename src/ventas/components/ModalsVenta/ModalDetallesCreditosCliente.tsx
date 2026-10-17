'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import DetallesCreditosCliente from '../CobroDeudaVenta/DetallesCreditosCliente';
import { FaTimes } from 'react-icons/fa';

interface ModalDetallesCreditosClienteProps {
  isOpen: boolean;
  onClose: () => void;
  idcliente: number;
  nombreCompleto: string;
  numDocumento: string;
}

const ModalDetallesCreditosCliente: React.FC<ModalDetallesCreditosClienteProps> = ({
  isOpen,
  onClose,
  idcliente,
  nombreCompleto,
  numDocumento,
}) => {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm" />
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
              <Dialog.Panel
                className="
                  relative w-full max-w-6xl h-full max-h-[800px]
                  transform overflow-auto rounded-2xl
                  bg-white dark:bg-gray-900
                  shadow-2xl transition-all
                  border border-gray-200 dark:border-gray-700
                "
              >
                {/* Botón cerrar */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={onClose}
                    className="
                      rounded-full p-2 shadow-lg transition
                      bg-white hover:bg-gray-100 text-gray-700
                      dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200
                    "
                    aria-label="Cerrar"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>

                {/* Contenido */}
                <div className="p-6 text-gray-800 dark:text-gray-200">
                  <DetallesCreditosCliente
                    idcliente={idcliente}
                    nombreCompleto={nombreCompleto}
                    numDocumento={numDocumento}
                  />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalDetallesCreditosCliente;
