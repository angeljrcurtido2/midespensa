'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';

import CajaResumen from '../../CierreCaja/CajaResumen';
interface ModalResumenCajaProps {
  isOpen: boolean;
  idmovimiento: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const ModalResumenCaja: React.FC<ModalResumenCajaProps> = ({
  isOpen,
  onClose,
  onSuccess,
  idmovimiento,
}) => {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="dark:bg-gray-800 w-full max-w-[1380px] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <CajaResumen idmovimiento={idmovimiento} onClose={onClose} onSuccess={onSuccess}/>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalResumenCaja;
