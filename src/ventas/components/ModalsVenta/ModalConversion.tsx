// components/Conversión.tsx
'use client';

import {type FC, useEffect, useState } from 'react';
import ModalAdvert from '../../../components/ModalAdvert';

interface ModalConversionProps {
    isOpen: boolean;
    unidadMedida: 'KG' | 'L';
    onClose: () => void;
    onConfirm: (valorConvertido: number) => void;
}

const ModalConversion: FC<ModalConversionProps> = ({ isOpen, unidadMedida, onClose, onConfirm }) => {
    const [advertMessage,setAdvertMessage] = useState("");
    const [valor, setValor] = useState<string>('');

    useEffect(() => { console.log(valor) }, [valor])
    const handleConfirm = () => {
        const valorNumerico = parseFloat(valor);
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
            setAdvertMessage('⚠️ Ingrese un número válido mayor a 0');
            return;
        }

        const convertido = valorNumerico / 1000;
        console.log('Valor convertido:', convertido);
        onConfirm(Number(convertido.toFixed(3)));
        setValor('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-[90%] max-w-md">
                <h2 className="text-xl font-bold mb-2">Ingresar cantidad parcial</h2>
                <p className="text-sm mb-4 text-gray-700">
                    Este producto se vende por {unidadMedida === 'KG' ? 'peso (KG)' : 'volumen (L)'}.
                    Ingrese la cantidad en {unidadMedida === 'KG' ? 'gramos' : 'mililitros'}.
                    Ejemplo: 1500 equivale a 1.5 {unidadMedida}.
                </p>

                <input
                    type="number"
                    placeholder={`Cantidad en ${unidadMedida === 'KG' ? 'gramos' : 'mililitros'}`}
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="w-full border rounded px-3 py-2 mb-4"
                />

                <div className="flex justify-end gap-3">

                    <button type='button' onClick={onClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">
                        Cancelar
                    </button>
                    <button type='button' onClick={handleConfirm} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                        Confirmar
                    </button>

                </div>
            </div>
            <ModalAdvert isOpen={!!advertMessage} onClose={()=>setAdvertMessage("")} message={advertMessage}/>
                
        </div>
    );
};

export default ModalConversion;
