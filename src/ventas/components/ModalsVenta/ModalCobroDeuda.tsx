'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import CobroDeudaVenta from '../CobroDeudaVenta/CobroDeudaVenta'
import type { ComprobantePago } from '../interface';

interface ModalCobroDeudaProps {
  idDeuda: number;
  montoMaximo?:number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; 
  setComprobante?: (data: ComprobantePago) => void;
  setShowComprobante?: (value: boolean) => void;
}

const ModalCobroDeuda: React.FC<ModalCobroDeudaProps> = ({
  idDeuda,
  montoMaximo,
  isOpen,
  onClose,
  onSuccess,
  setComprobante,
  setShowComprobante
}) => {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="dark:bg-gray-800 w-full max-w-[1000px] max-h-[90vh] transform overflow-y-auto rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            {/* Componente de productos en modo selección */}
            <CobroDeudaVenta montoMaximo={montoMaximo} iddeuda={idDeuda} onSuccess={onSuccess} onClose={onClose} setComprobante={setComprobante} setShowComprobante={setShowComprobante} />
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalCobroDeuda;
