'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { X, Package, Plus, Trash2 } from 'lucide-react';

export type AtributoNuevo = { atributo: string; valor: string; cantidad: number };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  nombre: string;
  /** Unidades que entran en la compra: lo que hay que repartir entre los valores. */
  unidades: number;
  inicial?: AtributoNuevo[] | null;
  /** Lista vacía = el producto no maneja atributos. */
  onConfirm: (atributos: AtributoNuevo[]) => void;
}

export const textoAtributosNuevos = (a: AtributoNuevo[] | null | undefined) =>
  (a || []).filter((x) => x.cantidad > 0).map((x) => `${x.valor} ×${x.cantidad}`).join(', ');

export const sumaAtributosNuevos = (a: AtributoNuevo[] | null | undefined) =>
  (a || []).reduce((acc, x) => acc + (Number(x.cantidad) || 0), 0);

/**
 * Atributos de un producto NUEVO que se está comprando (ej. detergente: Color → Azul 5,
 * Verde 4, Rojo 3). Cada valor entra con su stock; al guardar la compra se crean solos.
 */
export default function ModalAtributosNuevos({ isOpen, onClose, nombre, unidades, inicial, onConfirm }: Props) {
  const [filas, setFilas] = useState<AtributoNuevo[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setFilas(inicial?.length ? inicial.map((f) => ({ ...f })) : [{ atributo: 'Color', valor: '', cantidad: 0 }]);
  }, [isOpen, inicial]);

  const suma = useMemo(() => sumaAtributosNuevos(filas), [filas]);
  const falta = unidades - suma;
  const incompletos = filas.some((f) => !f.atributo.trim() || !f.valor.trim());
  const repetidos = filas.some(
    (f, i) => filas.findIndex((x) => x.atributo.trim().toLowerCase() === f.atributo.trim().toLowerCase() && x.valor.trim().toLowerCase() === f.valor.trim().toLowerCase()) !== i,
  );
  const listo = filas.length > 0 && !incompletos && !repetidos && Math.abs(falta) < 0.0001;

  const cambiar = (i: number, cambios: Partial<AtributoNuevo>) =>
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...cambios } : f)));

  const campo = 'rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-xl overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
              <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2.5 rounded-xl">
                    <Package className="text-white" size={22} />
                  </div>
                  <div>
                    <Dialog.Title className="text-lg font-bold text-white">Atributos del producto</Dialog.Title>
                    <p className="text-sm text-purple-100 truncate max-w-xs">{nombre}</p>
                  </div>
                </div>
                <button type="button" onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg" aria-label="Cerrar">
                  <X className="text-white" size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Indicá cuántas de las <b>{unidades}</b> unidades que entran son de cada valor (ej. Color: Azul 5, Verde 4, Rojo 3). Cada valor queda con su propio stock.
                </p>

                {filas.map((f, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_5rem_2.25rem] items-center gap-2">
                    <input aria-label="Atributo" placeholder="Color" value={f.atributo} onChange={(e) => cambiar(i, { atributo: e.target.value })} className={campo} />
                    <input aria-label="Valor" placeholder="Azul" value={f.valor} onChange={(e) => cambiar(i, { valor: e.target.value })} className={campo} />
                    <input
                      aria-label="Cantidad"
                      type="number"
                      min={0}
                      value={f.cantidad}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => cambiar(i, { cantidad: Math.max(0, Math.floor(Number(e.target.value)) || 0) })}
                      className={`${campo} text-center font-bold`}
                    />
                    <button type="button" aria-label="Quitar" onClick={() => setFilas((prev) => prev.filter((_, idx) => idx !== i))} className="h-9 w-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setFilas((prev) => [...prev, { atributo: prev[prev.length - 1]?.atributo || 'Color', valor: '', cantidad: 0 }])}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-purple-400 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100"
                >
                  <Plus size={16} /> Agregar valor
                </button>

                <div className={`rounded-xl px-4 py-3 text-sm font-bold ${listo ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
                  {repetidos
                    ? 'Hay un valor repetido.'
                    : incompletos
                      ? 'Completá el nombre del atributo y el valor de cada fila.'
                      : listo
                        ? `Repartido: ${suma} de ${unidades}`
                        : falta > 0
                          ? `Faltan ${falta} por repartir (${suma} de ${unidades})`
                          : `Sobran ${Math.abs(falta)} (${suma} de ${unidades})`}
                </div>
              </div>

              <div className="flex flex-wrap justify-between gap-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-6 py-4">
                <button type="button" onClick={() => { onConfirm([]); }} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-50">
                  Sin atributos
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!listo}
                    onClick={() => onConfirm(filas.map((f) => ({ atributo: f.atributo.trim(), valor: f.valor.trim(), cantidad: Number(f.cantidad) || 0 })))}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 text-sm font-bold text-white hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
