'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import GestionDetalleLiquidacion from '../GestionDetalleLiquidacion';

interface ModalDetalleLiquidacionProps {
  idliquidacion: number | string;
  isOpen: boolean;
  onClose: () => void;
}

const ModalDetalleLiquidacion = ({ idliquidacion, isOpen, onClose }: ModalDetalleLiquidacionProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-3">
          <Dialog.Panel className="w-full max-w-[1200px] max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-6 text-left align-middle shadow-xl transition-all">
            <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-4">Detalle de Liquidacion #{idliquidacion}</h3>
            {idliquidacion ? (
              <GestionDetalleLiquidacion idliquidacion={idliquidacion} />
            ) : (
              <div className="text-gray-600 dark:text-gray-300">Seleccione una liquidacion para ver detalles.</div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalDetalleLiquidacion;
