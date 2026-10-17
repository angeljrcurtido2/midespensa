'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import CrearCompra from '../CrearCompra';
import BotonCerrarModal from '../../../components/BotonCerrarModal';
import { styleBoxModal } from '../../../components/utils/stylesGral';

interface ModalCrearCompraProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;  
}

const ModalCrearCompra: React.FC<ModalCrearCompraProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className={styleBoxModal}>
            <BotonCerrarModal onClose={onClose} label="Cerrar nueva compra" />
            <CrearCompra onSuccess={onSuccess} onClose={onClose}/>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalCrearCompra;
