'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import React from 'react';
import { getIngresosPorMovimiento, getIngresosyEgresosPorMovimiento } from '../../../services/ingreso';
import { getEgresosPorMovimiento } from '../../../services/egreso';
import { ArrowsRightLeftIcon, ArrowTrendingDownIcon, BanknotesIcon } from '@heroicons/react/24/outline';

interface ModalButtonFetchProps {
    idMovimiento: number;
    isOpen: boolean;
    onClose: () => void;
}

const ModalButtonFetch: React.FC<ModalButtonFetchProps> = ({
    idMovimiento,
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    const handleFetchReportIngreso = async (id: number) => {
        try {
            const res = await getIngresosPorMovimiento(id)
            if (res.data?.comprobanteBase64) {
                const base64 = res.data.comprobanteBase64;
                const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error("Error de reporte", error)
        }
    }

    const handleFetchReportEgreso = async (id: number) => {
        try {
            const res = await getEgresosPorMovimiento(id)
            if (res.data?.comprobanteBase64) {
                const base64 = res.data.comprobanteBase64;
                const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error("Error de reporte", error)
        }
    }

    const handleFetchReportResumen = async (id: number) => {
        try {
            const res = await getIngresosyEgresosPorMovimiento(id)
            if (res.data?.comprobanteBase64) {
                const base64 = res.data.comprobanteBase64;
                const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error("Error de reporte", error)
        }
    }

    const baseBtn =
        'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium shadow transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2';

   return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black/40 dark:bg-black/60" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl border border-gray-200 dark:border-gray-700 transition-all">
                        <Dialog.Title className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                            Generar reporte
                        </Dialog.Title>

                        <div className="space-y-3">
                            {/* INGRESOS */}
                            <button
                                className={`${baseBtn} bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 focus:ring-emerald-500 dark:focus:ring-emerald-400`}
                                onClick={() => handleFetchReportIngreso(idMovimiento)}
                            >
                                <BanknotesIcon className="h-5 w-5" />
                                Movimientos Ingresos
                            </button>

                            {/* EGRESOS */}
                            <button
                                className={`${baseBtn} bg-rose-600 dark:bg-rose-700 text-white hover:bg-rose-700 dark:hover:bg-rose-600 focus:ring-rose-500 dark:focus:ring-rose-400`}
                                onClick={() => handleFetchReportEgreso(idMovimiento)}
                            >
                                <ArrowTrendingDownIcon className="h-5 w-5" />
                                Movimientos Egresos
                            </button>

                            {/* RESUMEN */}
                            <button
                                className={`${baseBtn} bg-indigo-600 dark:bg-indigo-700 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-400`}
                                onClick={() => handleFetchReportResumen(idMovimiento)}
                            >
                                <ArrowsRightLeftIcon className="h-5 w-5" />
                                Movimientos Resumen
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ModalButtonFetch;
