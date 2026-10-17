'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import FormCheque from './FormCheque';

interface ModalFormChequeProps {
  isOpen: boolean;
  onClose: () => void;
  setDatosCheque: (data: any) => void;
  datosCheque: any;
}

const ModalFormCheque: React.FC<ModalFormChequeProps> = ({
  isOpen,
  onClose,
  setDatosCheque,
  datosCheque
}) => {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="dark:bg-gray-800 w-full max-w-[580px] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            {/* Componente de productos en modo selección */}
            <FormCheque onClose={onClose} datosCheque={datosCheque} setDatosCheque={setDatosCheque}/>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );

};

export default ModalFormCheque;
