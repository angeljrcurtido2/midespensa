'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import CrearActividadesEconomicas from '../CrearActividadesEconomicas';

interface ModalsCrearActividadesEconomicasProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;   
}

const ModalsCrearActividadesEconomicas = ({ isOpen, onClose, onSuccess }: ModalsCrearActividadesEconomicasProps) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
            
                <div className="fixed inset-0 flex items-center justify-center">
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">

                           
                        <CrearActividadesEconomicas onSuccess={onSuccess} onClose={onClose} />
                    </Dialog.Panel>
                </div>
           
            </Dialog>
        </Transition>
    );
};

export default ModalsCrearActividadesEconomicas;
