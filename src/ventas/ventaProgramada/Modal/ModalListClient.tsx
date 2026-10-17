'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import ListarCliente from '../../../clientes/components/ListarCliente';
import { styleBoxModal } from '../../../components/utils/stylesGral';

interface ModalListClientProps {
  isOpen: boolean;
  onClose: () => void;
  isReportGenerated?: boolean; 
  onReportGenerated?: (idcliente:number) => void; 
}

const ModalListClient: React.FC<ModalListClientProps> = ({
  isOpen,
  onClose,
  isReportGenerated = false, 
  onReportGenerated = () => {}, 
}) => {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-opacity-30 flex items-center justify-center">
          <Dialog.Panel className={styleBoxModal}>
            {/* Listado de proveedores con modo selección */}
            <ListarCliente isReportGenerated={isReportGenerated}  onReportGenerated={onReportGenerated}/>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalListClient;
