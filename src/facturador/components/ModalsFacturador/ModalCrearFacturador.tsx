'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import CrearDatosFacturador from '../CrearFacturador';
import { styleModalBox } from '../../../components/utils/stylesGral';

interface ModalsCrearFacturadorProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;   
}

const ModalsCrearFacturador = ({ isOpen, onClose, onSuccess }: ModalsCrearFacturadorProps) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
            
                <div className="fixed inset-0 flex items-center justify-center">
                    <Dialog.Panel className={styleModalBox}>
                        <CrearDatosFacturador onSuccess={onSuccess} onClose={onClose} />
                    </Dialog.Panel>
                </div>
           
            </Dialog>
        </Transition>
    );
};

export default ModalsCrearFacturador;
