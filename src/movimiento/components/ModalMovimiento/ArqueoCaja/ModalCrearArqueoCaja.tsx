'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import CrearArqueoCaja from '../../Arqueo/CrearArqueoCaja';
interface ModalCrearIngresosVariosProps {
  isOpen: boolean;
  onClose: () => void;
  idmovimiento: number; 
  
}

const ModalCrearIngresosVarios: React.FC<ModalCrearIngresosVariosProps> = ({
  isOpen,
  onClose,
  idmovimiento,

}) => {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="w-full max-w-[480px] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            {/* Componente de productos en modo selección */}
            <CrearArqueoCaja idmovimiento={idmovimiento}/>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalCrearIngresosVarios;
