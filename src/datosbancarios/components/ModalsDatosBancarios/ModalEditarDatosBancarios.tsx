'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import EditarDatosBancarios from '../EditarDatosBancarios';

interface ModalEditarCategoriaProps {
    id: number | string; 
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;   
}

const ModalEditarDatosBancarios = ({ isOpen, onClose, onSuccess, id }: ModalEditarCategoriaProps) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
            
                <div className="fixed inset-0 flex items-center justify-center">
                    <Dialog.Panel className="w-full max-w-[600px] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">

                           
                        <EditarDatosBancarios onSuccess={onSuccess} onClose={onClose} id={id} />
                    </Dialog.Panel>
                </div>
           
            </Dialog>
        </Transition>
    );
};

export default ModalEditarDatosBancarios;
