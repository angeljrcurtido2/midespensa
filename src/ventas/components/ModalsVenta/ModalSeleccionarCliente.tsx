'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import ListarCliente from '../../../clientes/components/ListarCliente';
interface ModalSeleccionarClienteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (producto: any) => void;
}

const ModalSeleccionarCliente: React.FC<ModalSeleccionarClienteProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="dark:bg-gray-800 w-full max-w-[1200px] max-h-[500px] overflow-auto transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            {/* Componente de productos en modo selección */}
            <ListarCliente onSelect={onSelect}/>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalSeleccionarCliente;
