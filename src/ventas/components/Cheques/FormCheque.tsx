'use client';

import { type FC } from 'react';
import { FaMoneyCheck, FaUniversity, FaHashtag, FaDollarSign, FaCalendarAlt, FaUser, FaCheck } from 'react-icons/fa';

interface Props {
    onClose: () => void;
    datosCheque: any;
    setDatosCheque: (data: any) => void;
}

const FormCheque: FC<Props> = ({  onClose, datosCheque, setDatosCheque }) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDatosCheque((prev: any) => ({
            ...prev,
            [name]: value,
        }));
    };

   return (
        <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 px-8 py-6">
                    <div className="flex items-center gap-3 text-white">
                        <div className="bg-white/20 dark:bg-gray-600/30 p-3 rounded-xl">
                            <FaMoneyCheck className="text-2xl" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Datos del Cheque</h2>
                            <p className="text-blue-100 dark:text-gray-300 text-sm">Ingresa la información del cheque</p>
                        </div>
                    </div>
                </div>

                {/* Formulario */}
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Banco */}
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <FaUniversity className="text-blue-600 dark:text-blue-400" />
                                Banco
                            </label>
                            <input
                                type="text"
                                name="banco"
                                value={datosCheque.banco || ''}
                                onChange={handleChange}
                                className="border-2 border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all hover:border-blue-300 dark:hover:border-gray-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="Nombre del banco"
                                required
                            />
                        </div>

                        {/* Nro. Cheque */}
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <FaHashtag className="text-blue-600 dark:text-blue-400" />
                                Nro. Cheque
                            </label>
                            <input
                                type="text"
                                name="nro_cheque"
                                value={datosCheque.nro_cheque || ''}
                                onChange={handleChange}
                                className="border-2 border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all hover:border-blue-300 dark:hover:border-gray-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="Número de cheque"
                                required
                            />
                        </div>

                        {/* Monto */}
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <FaDollarSign className="text-blue-600 dark:text-blue-400" />
                                Monto
                            </label>
                            <input
                                type="number"
                                name="monto"
                                value={datosCheque.monto || ''}
                                onChange={handleChange}
                                className="border-2 border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all hover:border-blue-300 dark:hover:border-gray-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="Monto del cheque"
                                required
                            />
                        </div>

                        {/* Titular */}
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <FaUser className="text-blue-600 dark:text-blue-400" />
                                Titular
                            </label>
                            <input
                                type="text"
                                name="titular"
                                value={datosCheque.titular || ''}
                                onChange={handleChange}
                                className="border-2 border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all hover:border-blue-300 dark:hover:border-gray-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="Titular del cheque"
                                required
                            />
                        </div>

                        {/* Fecha Emisión */}
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <FaCalendarAlt className="text-blue-600 dark:text-blue-400" />
                                Fecha Emisión
                            </label>
                            <input
                                type="date"
                                name="fecha_emision"
                                value={datosCheque.fecha_emision || ''}
                                onChange={handleChange}
                                className="border-2 border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all hover:border-blue-300 dark:hover:border-gray-500"
                                required
                            />
                        </div>

                        {/* Fecha Vencimiento */}
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <FaCalendarAlt className="text-blue-600 dark:text-blue-400" />
                                Fecha Vencimiento
                            </label>
                            <input
                                type="date"
                                name="fecha_vencimiento"
                                value={datosCheque.fecha_vencimiento || ''}
                                onChange={handleChange}
                                className="border-2 border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all hover:border-blue-300 dark:hover:border-gray-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Botón */}
                    <div className="mt-8">
                        <button
                            onClick={onClose}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white py-3 rounded-xl transition-all text-lg font-semibold shadow-lg hover:shadow-xl"
                        >
                            <FaCheck className="text-xl" />
                            Confirmar Datos del Cheque
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormCheque;