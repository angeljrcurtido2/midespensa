'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { FaCashRegister, FaMoon } from 'react-icons/fa';

interface Props {
  isOpen: boolean;
  empleado: string;
  total: string;
  onClose: () => void;
  /** Devuelve un mensaje de error si el servidor rechaza el pago (p. ej. no hay caja abierta). */
  onConfirm: (registrarEgreso: boolean) => Promise<string | null>;
}

/**
 * Al marcar una liquidación como pagada, quien paga decide si el pago sale de caja.
 * Sueldos que se pagan de noche, con la caja cerrada, se marcan "sin caja".
 */
export default function ModalPagoLiquidacion({ isOpen, empleado, total, onClose, onConfirm }: Props) {
  const [enviando, setEnviando] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEnviando(null);
      setError('');
    }
  }, [isOpen]);

  const elegir = async (registrar: boolean) => {
    setEnviando(registrar);
    setError('');
    const msg = await onConfirm(registrar);
    setEnviando(null);
    if (msg) setError(msg);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (enviando === null ? onClose() : undefined)}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">Pagar liquidación</Dialog.Title>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {empleado} · <b>{total}</b>
            </p>
            <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-gray-100">¿Este pago sale de la caja?</p>

            <div className="mt-3 grid gap-3">
              <button
                type="button"
                disabled={enviando !== null}
                onClick={() => elegir(true)}
                className="flex items-start gap-3 rounded-xl border-2 border-blue-300 bg-blue-50 dark:bg-gray-700 p-4 text-left hover:bg-blue-100 disabled:opacity-60"
              >
                <FaCashRegister className="mt-1 text-blue-600" />
                <span>
                  <span className="block font-bold text-blue-900 dark:text-white">Sí, registrar como egreso de caja</span>
                  <span className="block text-xs text-blue-800 dark:text-gray-300">
                    Descuenta de tu caja abierta y aparece en Ingresos y Egresos y en el cierre de caja.
                  </span>
                </span>
              </button>
              <button
                type="button"
                disabled={enviando !== null}
                onClick={() => elegir(false)}
                className="flex items-start gap-3 rounded-xl border-2 border-gray-300 bg-gray-50 dark:bg-gray-700 p-4 text-left hover:bg-gray-100 disabled:opacity-60"
              >
                <FaMoon className="mt-1 text-gray-600" />
                <span>
                  <span className="block font-bold text-gray-900 dark:text-white">No, solo marcar como pagada</span>
                  <span className="block text-xs text-gray-600 dark:text-gray-300">
                    No toca la caja. Para sueldos que se pagan de noche o fuera del sistema.
                  </span>
                </span>
              </button>
            </div>

            {error && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</div>}

            <div className="mt-4 flex justify-end">
              <button type="button" disabled={enviando !== null} onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                Cancelar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}
