'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, type ReactNode } from 'react';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Ancho máximo del panel; los formularios con grilla necesitan más aire. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const ANCHOS = {
  sm: 'max-w-md',
  md: 'max-w-[600px]',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

/**
 * Contenedor de modal reutilizable.
 *
 * Los modales existentes repiten este armado con el panel fijo y sin scroll,
 * lo que deja los formularios largos —como la grilla de permisos— cortados sin
 * forma de llegar a los botones. Acá el panel tiene altura máxima y el
 * contenido desborda con scroll propio.
 */
const ModalBase = ({ isOpen, onClose, children, size = 'xl' }: ModalBaseProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`w-full ${ANCHOS[size]} transform rounded-2xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto`}
              >
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalBase;
