'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import CobroDeudaCompra from '../CobroDeudaCompra/CobroDeudaCompra';
import BotonCerrarModal from '../../../components/BotonCerrarModal';
import type { ComprobantePago } from '../../../ventas/components/interface';

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
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="dark:bg-gray-800 w-[calc(100vw-2rem)] max-w-[600px] max-h-[90vh] overflow-auto transform rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-xl transition-all">
            <BotonCerrarModal onClose={onClose} label="Cerrar cobro de deuda" />
            <CobroDeudaCompra montoMaximo={montoMaximo} iddeuda={idDeuda} onSuccess={onSuccess} onClose={onClose} setComprobante={setComprobante} setShowComprobante={setShowComprobante} />
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalCobroDeuda;
