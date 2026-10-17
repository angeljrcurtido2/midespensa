'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import ListarActividadesEconomicas from '../ListarActividadesEconomicas';

interface ModalsListarActividadesEconomicasProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (selectedActivities: any[]) => void;
}

const ModalsListarActividadesEconomicas = ({ isOpen, onClose, onSelect }: ModalsListarActividadesEconomicasProps) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
            
                <div className="fixed inset-0 flex items-center justify-center">
                    <Dialog.Panel className="w-full max-w-[980px] h-full max-h-[600px] transform overflow-auto rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                           
                        <ListarActividadesEconomicas onSelect={onSelect}/>
                    </Dialog.Panel>
                </div>
           
            </Dialog>
        </Transition>
    );
};

export default ModalsListarActividadesEconomicas;
