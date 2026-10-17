'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface ModalConfirmarProductosProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productos: any[];
}
const styleTableTh = "px-4 py-2 text-left font-medium text-gray-700";
const styleTableTd = "px-4 py-2"
const ModalConfirmarProductos = ({ isOpen, onClose, onConfirm, productos }: ModalConfirmarProductosProps) => {
  return (
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 dark:bg-black/60" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className="
            w-full max-w-md
            transform overflow-hidden
            rounded-2xl
            bg-white dark:bg-slate-900
            p-6
            text-left align-middle
            shadow-xl
            transition-all
          "
        >
          {/* Title */}
          <Dialog.Title
            as="h3"
            className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4"
          >
            Confirmar carga de productos
          </Dialog.Title>

          {/* Tabla */}
          {/* overflow-x-auto: la tabla tiene 4 columnas y en móvil desbordaba
              horizontalmente, sacando el modal fuera de la pantalla. */}
          <div className="overflow-y-auto overflow-x-auto max-h-60 mb-4">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-slate-800">
                <tr>
                  <th className={`${styleTableTh} text-gray-700 dark:text-slate-200`}>Producto</th>
                  <th className={`${styleTableTh} text-gray-700 dark:text-slate-200`}>Unidad</th>
                  <th className={`${styleTableTh} text-gray-700 dark:text-slate-200`}>Cod_Barra</th>
                  <th className={`${styleTableTh} text-gray-700 dark:text-slate-200`}>Cantidad</th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                {productos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-2 text-center text-gray-500 dark:text-slate-400"
                    >
                      No hay productos
                    </td>
                  </tr>
                ) : (
                  productos.map((p, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className={`${styleTableTd} text-gray-800 dark:text-slate-100`}>
                        {p.nombre_producto}
                      </td>
                      <td className={`${styleTableTd} text-gray-800 dark:text-slate-100`}>
                        {p.unidad_medida}
                      </td>
                      <td
                        className={`${styleTableTd} max-w-[100px] truncate text-gray-800 dark:text-slate-100`}
                      >
                        {p.cod_barra}
                      </td>
                      <td className={`${styleTableTd} text-gray-800 dark:text-slate-100`}>
                        {p.presentacion_compra === 'CAJA'
                          ? `${p.cantidad} ${Number(p.cantidad) === 1 ? 'caja' : 'cajas'}`
                          : p.presentacion_compra === 'PACK'
                            ? `${p.cantidad} ${Number(p.cantidad) === 1 ? 'pack' : 'packs'}`
                            : p.cantidad}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              className="
                px-4 py-2
                bg-gray-300 dark:bg-slate-700
                hover:bg-gray-400 dark:hover:bg-slate-600
                text-gray-800 dark:text-slate-100
                rounded-lg
                transition
              "
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="
                px-4 py-2
                bg-green-600 dark:bg-green-500
                hover:bg-green-700 dark:hover:bg-green-600
                text-white
                rounded-lg
                transition
              "
              onClick={onConfirm}
            >
              Confirmar
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  </Transition>
);
};

export default ModalConfirmarProductos;
