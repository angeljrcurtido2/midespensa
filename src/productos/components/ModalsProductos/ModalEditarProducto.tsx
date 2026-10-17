'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import EditarProducto from '../EditarProductos';

interface ModalEditarProductoProps {
    id: number | string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ModalEditarProducto = ({ isOpen, onClose, onSuccess, id }: ModalEditarProductoProps) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 flex items-center justify-center 2xl:justify-center xl:justify-center lg:justify-center md:justify-center">
                    <Dialog.Panel className="dark:bg-slate-800 w-full max-w-[95vw] max-h-[95vh] sm:max-w-[600px] sm:max-h-[90vh] md:max-w-[750px] md:max-h-[85vh] lg:max-w-[900px] lg:max-h-[85vh] xl:max-w-[950px] xl:max-h-[90vh] 2xl:max-w-[1000px] 2xl:max-h-[90vh] overflow-auto rounded-2xl bg-white p-0 transition-all shadow-xl">
                        <EditarProducto onSuccess={onSuccess} onClose={onClose} id={id} />
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ModalEditarProducto;
