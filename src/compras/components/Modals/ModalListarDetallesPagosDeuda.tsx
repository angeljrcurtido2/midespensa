'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import ListarDetallesPagosDeuda from '../CobroDeudaCompra/ListarDetallesPagosDeuda';
import BotonCerrarModal from '../../../components/BotonCerrarModal';

interface ModalListarDetallesPagosDeudaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: ()=> void;
  iddeuda: number;
}

const ModalListarDetallesPagosDeuda: React.FC<ModalListarDetallesPagosDeudaProps> = ({
  isOpen,
  onClose,
  onSuccess,
  iddeuda
}) => {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 flex items-center justify-center">
          {/* Igual que el resto de modales: alto en vh para no recortar en
              pantallas bajas y ancho con margen lateral en móvil. */}
          <Dialog.Panel className="dark:bg-gray-800 w-[calc(100vw-2rem)] max-w-[1200px] max-h-[90vh] transform overflow-auto rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-xl transition-all">
            <BotonCerrarModal onClose={onClose} label="Cerrar detalle de pagos" />
            <ListarDetallesPagosDeuda iddeuda={iddeuda} onSuccess={onSuccess} />
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalListarDetallesPagosDeuda;
