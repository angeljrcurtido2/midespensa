'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import ListarProductos from '../../../productos/components/ListarProductos';
import BotonCerrarModal from '../../../components/BotonCerrarModal';

interface ModalSeleccionarProductoProps {
  isOpen: boolean;
  isBuy: boolean;
  onClose: () => void;
  setCantidadMaximo?: (cantidad: number) => void;
  setCantidadProducto: (cantidad: number) => void;
  configVentaPorLote?: boolean;
  cantidadProducto?: number;
  detalles?: any[];
  onSelect: (producto: any) => void;
  stockVerify?:boolean
  initialSearch?: string;
}

const ModalSeleccionarProducto: React.FC<ModalSeleccionarProductoProps> = ({
  isOpen,
  isBuy,
  onClose,
  setCantidadMaximo,
  setCantidadProducto,
  configVentaPorLote = false,
  cantidadProducto,
  detalles,
  onSelect,
  stockVerify = false,
  initialSearch = '',
}) => {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 flex items-center justify-center">
          {/* max-h en vh y ancho con margen lateral: con max-h-[500px] fijo el
              panel recortaba el contenido en pantallas bajas y el botón de
              seleccionar quedaba fuera de vista. */}
          <Dialog.Panel className="dark:bg-slate-800 w-[calc(100vw-2rem)] max-w-[1200px] max-h-[90vh] overflow-auto transform rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-xl transition-all">
            <BotonCerrarModal onClose={onClose} label="Cerrar selección de productos" />
            {initialSearch && (
              <p className="mb-3 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                Hay varios productos con ese codigo. Revisa los detalles y selecciona el correcto.
              </p>
            )}
            <ListarProductos isBuy={isBuy} configVentaPorLote = {configVentaPorLote} onSelect={onSelect} detalles = {detalles} setCantidadProducto = {setCantidadProducto} cantidadProducto={cantidadProducto} stockVerify = {stockVerify} setCantidadMaximo = {setCantidadMaximo} initialSearch={initialSearch} />
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalSeleccionarProducto;
