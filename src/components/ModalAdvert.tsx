'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface ModalAdvertProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  onConfirm?: () => void;
  confirmButtonText?: string;
}

const ModalAdvert = ({
  isOpen,
  onClose,
  message,
  onConfirm,
  confirmButtonText = 'Confirmar',
}: ModalAdvertProps) => {
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
            <Dialog.Panel className="w-full max-w-sm overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">

              {/* Header curvo con gradiente */}
              <div className="relative">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 pt-8 pb-12 px-6">
                  <div className="absolute inset-x-0 bottom-0 h-6 bg-white dark:bg-gray-800 rounded-t-[2rem]" />
                </div>

                {/* Icono flotante */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-6">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-full">
                      <ExclamationTriangleIcon className="h-8 w-8 text-white" />
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
                  Advertencia
                </Dialog.Title>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                  {message}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    Cancelar
                  </button>

                  {onConfirm && (
                    <button
                      onClick={onConfirm}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                      {confirmButtonText}
                    </button>
                  )}
                </div>
              </div>

            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalAdvert;
