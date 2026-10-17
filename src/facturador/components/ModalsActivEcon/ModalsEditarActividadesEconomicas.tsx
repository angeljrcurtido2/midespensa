'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import EditarActividadEconomica from '../EditarActividadEconomica';

interface ModalsEditarActividadesEconomicasProps {
    id: number | string; 
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;   
}

const ModalsEditarActividadesEconomicas = ({ isOpen, onClose, onSuccess, id }: ModalsEditarActividadesEconomicasProps) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
            
                <div className="fixed inset-0 flex items-center justify-center">
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">

                           
                        <EditarActividadEconomica onSuccess={onSuccess} onClose={onClose} id={id} />
                    </Dialog.Panel>
                </div>
           
            </Dialog>
        </Transition>
    );
};

export default ModalsEditarActividadesEconomicas;
