'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';

import ListarClientesConCuotasVencidas from '../ListarClientesConCuotasVencidas';

interface ModalCuotasVencidasProps {
    isOpen: boolean;
    onClose: () => void;
}

const ModalCuotasVencidas: React.FC<ModalCuotasVencidasProps> = ({
    isOpen,
    onClose,
}) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 flex items-center justify-center">
                    <Dialog.Panel className="w-auto max-h-[800px] max-w-[1790px] transform overflow-auto rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                        <ListarClientesConCuotasVencidas />
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ModalCuotasVencidas;
