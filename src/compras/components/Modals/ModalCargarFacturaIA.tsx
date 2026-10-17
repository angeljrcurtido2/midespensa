'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import CargarFacturaIA from '../CargarFacturaIA/CargarFacturaIA';
import BotonCerrarModal from '../../../components/BotonCerrarModal';
import { styleBoxModal } from '../../../components/utils/stylesGral';

interface ModalCargarFacturaIAProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ModalCargarFacturaIA: React.FC<ModalCargarFacturaIAProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className={styleBoxModal}>
            <BotonCerrarModal onClose={onClose} label="Cerrar carga de factura con IA" />
            <CargarFacturaIA onSuccess={onSuccess} onClose={onClose} />
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalCargarFacturaIA;
