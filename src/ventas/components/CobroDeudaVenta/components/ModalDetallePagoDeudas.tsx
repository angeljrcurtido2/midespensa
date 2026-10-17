'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import DetallePagoDeudas from './DetallePagoDeudas';

interface ModalDetallePagoDeudaProps {
  isOpen: boolean;
  onClose: () => void;
  pago: any; 
}

const ModalDetallePagoDeuda: React.FC<ModalDetallePagoDeudaProps> = ({
  isOpen,
  onClose,
  pago
}) => {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <Dialog.Panel className="dark:bg-gray-800 w-full max-w-[680px] h-full max-h-[600px] transform overflow-auto rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <DetallePagoDeudas pago={pago} />
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalDetallePagoDeuda;
