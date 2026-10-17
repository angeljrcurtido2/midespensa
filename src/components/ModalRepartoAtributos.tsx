'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { X, Package } from 'lucide-react';
import type { DetalleProductoResponse } from '../services/productoDetalle';

export type RepartoItem = { iddetalle: number; cantidad: number };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  nombre: string;
  /** Unidades que hay que repartir entre los atributos (las que se venden o las que entran). */
  unidades: number;
  atributos: DetalleProductoResponse[];
  /** 'venta' limita cada atributo a su stock; 'compra' solo informa el stock actual. */
  modo: 'venta' | 'compra';
  inicial?: RepartoItem[] | null;
  onConfirm: (reparto: RepartoItem[]) => void;
}

/** "Azul ×5, Verde ×4" a partir del reparto y la lista de atributos. */
export const textoReparto = (reparto: RepartoItem[] | null | undefined, atributos: DetalleProductoResponse[]) =>
  (reparto || [])
    .map((r) => `${atributos.find((a) => a.iddetalle === r.iddetalle)?.valor ?? '?'} ×${r.cantidad}`)
    .join(', ');

export const sumaReparto = (reparto: RepartoItem[] | null | undefined) =>
  (reparto || []).reduce((acc, r) => acc + Number(r.cantidad || 0), 0);

/**
 * Reparte las unidades de un producto entre sus atributos (color, sabor, tamaño...).
 * Ejemplo: caja de 12 detergentes → Azul 5, Verde 4, Rojo 3. No deja confirmar hasta que
 * el reparto suma exactamente las unidades.
 */
export default function ModalRepartoAtributos({ isOpen, onClose, nombre, unidades, atributos, modo, inicial, onConfirm }: Props) {
  const [valores, setValores] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!isOpen) return;
    const base: Record<number, number> = {};
    atributos.forEach((a) => {
      base[a.iddetalle] = inicial?.find((i) => i.iddetalle === a.iddetalle)?.cantidad ?? 0;
    });
    if (!inicial?.length && atributos.length === 1) base[atributos[0].iddetalle] = unidades;
    setValores(base);
  }, [isOpen, atributos, inicial, unidades]);

  const suma = useMemo(() => Object.values(valores).reduce((a, b) => a + b, 0), [valores]);
  const falta = unidades - suma;
  const exceso = (a: DetalleProductoResponse) => modo === 'venta' && (valores[a.iddetalle] ?? 0) > Number(a.cantidad);
  const listo = Math.abs(falta) < 0.0001 && !atributos.some(exceso);

  const cambiar = (id: number, n: number) => setValores((prev) => ({ ...prev, [id]: Math.max(0, Math.floor(n) || 0) }));

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
              <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2.5 rounded-xl">
                    <Package className="text-white" size={22} />
                  </div>
                  <div>
                    <Dialog.Title className="text-lg font-bold text-white">
                      {modo === 'venta' ? 'De qué atributo vendés' : 'Qué atributos entraron'}
                    </Dialog.Title>
                    <p className="text-sm text-purple-100 truncate max-w-xs">{nombre}</p>
                  </div>
                </div>
                <button type="button" onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg" aria-label="Cerrar">
                  <X className="text-white" size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {modo === 'venta'
                    ? `Repartí las ${unidades} unidades que salen entre los atributos.`
                    : `Repartí las ${unidades} unidades que entran entre los atributos.`}
                </p>

                {atributos.map((a) => {
                  const v = valores[a.iddetalle] ?? 0;
                  const sobra = exceso(a);
                  return (
                    <div
                      key={a.iddetalle}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${sobra ? 'border-red-300 bg-red-50' : 'border-gray-200 dark:border-gray-600'}`}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{a.valor}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {a.atributo} · stock {Number(a.cantidad).toLocaleString('es-PY')}
                        </p>
                        {sobra && <p className="text-xs font-semibold text-red-700">Solo hay {Number(a.cantidad)} de {a.valor}.</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" aria-label={`Menos ${a.valor}`} onClick={() => cambiar(a.iddetalle, v - 1)} className="h-9 w-9 rounded-lg bg-gray-100 text-xl font-bold text-gray-700 hover:bg-gray-200">−</button>
                        <input
                          aria-label={`Cantidad de ${a.valor}`}
                          type="number"
                          min={0}
                          value={v}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => cambiar(a.iddetalle, Number(e.target.value))}
                          className="w-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1 py-2 text-center font-bold text-gray-900 dark:text-white"
                        />
                        <button type="button" aria-label={`Más ${a.valor}`} onClick={() => cambiar(a.iddetalle, v + 1)} className="h-9 w-9 rounded-lg bg-purple-100 text-xl font-bold text-purple-700 hover:bg-purple-200">+</button>
                      </div>
                    </div>
                  );
                })}

                <div className={`rounded-xl px-4 py-3 text-sm font-bold ${listo ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
                  {listo
                    ? `Repartido: ${suma} de ${unidades}`
                    : falta > 0
                      ? `Faltan ${falta} por repartir (${suma} de ${unidades})`
                      : `Sobran ${Math.abs(falta)} (${suma} de ${unidades})`}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-6 py-4">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!listo}
                  onClick={() => onConfirm(atributos.filter((a) => (valores[a.iddetalle] ?? 0) > 0).map((a) => ({ iddetalle: a.iddetalle, cantidad: valores[a.iddetalle] })))}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 text-sm font-bold text-white hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400"
                >
                  Confirmar
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
