'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import CrearDatosBancarios from '../CrearDatosBancarios';

interface ModalCrearDatosBancariosProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;   
}

const ModalCrearDatosBancarios = ({ isOpen, onClose, onSuccess }: ModalCrearDatosBancariosProps) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
            
                <div className="fixed inset-0 flex items-center justify-center">
                    <Dialog.Panel className="dark:bg-gray-800 w-full max-w-[800px] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                        <CrearDatosBancarios onSuccess={onSuccess} onClose={onClose} />
                    </Dialog.Panel>
                </div>
        
            </Dialog>
        </Transition>
    );
};

export default ModalCrearDatosBancarios;
