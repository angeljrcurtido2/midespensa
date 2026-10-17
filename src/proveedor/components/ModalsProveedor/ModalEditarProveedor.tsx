'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import EditarProveedor from '../EditarProveedor';

interface ModalEditarCategoriaProps {
    id: number | string; 
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; 
}

const ModalEditarProveedor = ({ isOpen, onClose, onSuccess, id }: ModalEditarCategoriaProps) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
            
                <div className="fixed inset-0 flex items-center justify-center">
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">

                        <EditarProveedor onSuccess={onSuccess} onClose={onClose} id={id} />
                    </Dialog.Panel>
                </div>
           
            </Dialog>
        </Transition>
    );
};

export default ModalEditarProveedor;
