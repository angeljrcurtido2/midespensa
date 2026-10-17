'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import FormTarjeta from './FormTarjeta';

interface ModalFormTarjetaProps {
  isOpen: boolean;
  onClose: () => void;
  setDatosTarjeta: (data: any) => void;
  datosTarjeta: any;
}

const ModalFormTarjeta: React.FC<ModalFormTarjetaProps> = ({
  isOpen,
  onClose,
  setDatosTarjeta,
  datosTarjeta
}) => {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="dark:bg-gray-800 w-full max-w-[580px] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            {/* Componente de productos en modo selección */}
            <FormTarjeta onClose={onClose} datosTarjeta={datosTarjeta} setDatosTarjeta={setDatosTarjeta}/>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );

};

export default ModalFormTarjeta;
