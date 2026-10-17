import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import RegisterUser from './register';

interface ModalRegistroUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/** Diálogo de registro: hoja blanca centrada, con scroll propio en pantallas bajas, igual de limpia que el login. */
const ModalRegistroUsuario: React.FC<ModalRegistroUsuarioProps> = ({ isOpen, onClose, onSuccess }) => (
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <Transition.Child as={Fragment} enter="duration-200 ease-out" enterFrom="opacity-0" enterTo="opacity-100" leave="duration-150 ease-in" leaveFrom="opacity-100" leaveTo="opacity-0">
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px]" aria-hidden="true" />
      </Transition.Child>
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Transition.Child as={Fragment} enter="duration-250 ease-out" enterFrom="opacity-0 translate-y-3 scale-[.98]" enterTo="opacity-100 translate-y-0 scale-100" leave="duration-150 ease-in" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Dialog.Panel className="relative w-full max-w-[560px] rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 sm:p-8">
              <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600">
                <X size={20} />
              </button>
              <RegisterUser onSuccess={onSuccess} />
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

export default ModalRegistroUsuario;
