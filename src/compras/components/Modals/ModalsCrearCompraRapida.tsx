'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import CrearCompraRapida from '../CompraRapida/CrearCompraRapida';
import BotonCerrarModal from '../../../components/BotonCerrarModal';
import { styleBoxModal } from '../../../components/utils/stylesGral';
import type { ProductoPrecargado } from '../CompraRapida/FormularioProducto/FormularioProducto';

interface ModalCrearCrearCompraRapidaProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    productoInicial?: ProductoPrecargado | null;
}

const ModalCrearCompraRapida = ({ isOpen, onClose, onSuccess, productoInicial }: ModalCrearCrearCompraRapidaProps) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 flex items-center justify-center 2xl:justify-center xl:justify-end md:justify-end">
                    <Dialog.Panel className={styleBoxModal}>
                        <BotonCerrarModal onClose={onClose} label="Cerrar compra rápida" />
                        <CrearCompraRapida onSuccess={onSuccess} onClose={onClose} productoInicial={productoInicial} />
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ModalCrearCompraRapida;
