'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import ListarClienteDVenta from '../CobroDeudaVenta/ListarClienteDVenta';

interface ModalListarClienteDVentaProps {
  isOpen: boolean;
  onClose: () => void;
  nombreCliente: string;

  disableSearch?: boolean; 
  setEstadoCliente?: (estado: string) => void;
  generateReport?:  ()=> void;
}

const ModalListarClienteDVenta: React.FC<ModalListarClienteDVentaProps> = ({
  isOpen,
  onClose,
  nombreCliente,

  setEstadoCliente,
  disableSearch = false,
  generateReport = () => {},
}) => {
  if (!isOpen) return null;
  console.log('nombreCliente en ModalListarClienteDVenta:', nombreCliente);
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="dark:bg-gray-600 w-full max-w-[1400px] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            {/* Componente de productos en modo selección */}
            <ListarClienteDVenta 
              nombreCliente={nombreCliente} 
         
      
              disableSearch={disableSearch} 
              setEstadoCliente={setEstadoCliente}
              generateReport={generateReport}
            />
          </Dialog.Panel> 
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalListarClienteDVenta;