'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import CrearSalario from '../CrearSalario';

interface ModalCrearSalarioProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalCrearSalario = ({ isOpen, onClose, onSuccess }: ModalCrearSalarioProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-3">
          <Dialog.Panel className="w-full max-w-[900px] max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-6 text-left align-middle shadow-xl transition-all">
            <CrearSalario onSuccess={onSuccess} onClose={onClose} />
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalCrearSalario;
