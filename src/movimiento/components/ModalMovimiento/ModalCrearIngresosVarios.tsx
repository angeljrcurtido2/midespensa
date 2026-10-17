'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import CrearIngresosVarios from '../CrearIngresosVarios';
interface ModalCrearIngresosVariosProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;  
}

const ModalCrearIngresosVarios: React.FC<ModalCrearIngresosVariosProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="dark:bg-gray-800 w-full max-w-[580px] h-full max-h-[800px] transform overflow-auto rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            {/* Componente de productos en modo selección */}
            <CrearIngresosVarios onSuccess={onSuccess} onClose={onClose}/>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalCrearIngresosVarios;
