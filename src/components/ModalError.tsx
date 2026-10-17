'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';

interface ModalErrorProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  showTable?: boolean;
  productos?: any[];
}

const ModalError = ({
  isOpen,
  onClose,
  message,
  showTable = false,
  productos = [],
}: ModalErrorProps) => {
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="ease-in duration-200"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <Dialog.Panel className="w-full max-w-[650px] overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">

              {/* Header curvo */}
              <div className="relative">
                <div className="bg-gradient-to-r from-red-600 to-rose-600 pt-8 pb-12 px-6">
                  <div className="absolute inset-x-0 bottom-0 h-6 bg-white dark:bg-gray-800 rounded-t-[2rem]" />
                </div>

                {/* Icono flotante */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-6">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg">
                    <div className="bg-gradient-to-r from-red-500 to-rose-600 p-3 rounded-full">
                      <ExclamationCircleIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div className="pt-10 pb-6 px-6 text-center">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1"
                >
                  Error
                </Dialog.Title>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {message}
                </p>

                {/* Tabla de errores */}
                {showTable && (
                  <div className="mt-4 overflow-x-auto max-h-64 rounded-xl border border-gray-200 dark:border-gray-600 text-left">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200">
                            Producto
                          </th>
                          <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                        {productos.length === 0 ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                            >
                              No hay productos duplicados
                            </td>
                          </tr>
                        ) : (
                          productos.map((producto: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 dark:text-gray-200">
                                {typeof producto === 'string'
                                  ? producto
                                  : producto.nombre_producto}
                              </td>
                              <td className="px-6 py-4 text-red-600 dark:text-red-400 font-medium">
                                {typeof producto === 'string'
                                  ? 'Producto duplicado'
                                  : producto.error}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Botón */}
                <div className="mt-6">
                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalError;
