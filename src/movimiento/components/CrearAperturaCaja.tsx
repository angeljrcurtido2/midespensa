'use client';

import { useState } from 'react';
import ModalAdvert from '../../components/ModalAdvert';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import { abrirMovimientoCaja } from '../../services/ingreso';
import { NumericFormat } from 'react-number-format';

interface AbrirCajaProps {
  idusuarios?: number; // ya no se usa: la caja se abre a nombre de quien tiene la sesión
  onSuccess?: () => void;
  onClose: () => void;
}

const AbrirCaja = ({ onSuccess, onClose }: AbrirCajaProps) => {
  const [monto, setMonto] = useState('');
  const [advertOpen, setAdvertOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('Caja abierta correctamente.');

  const handleAbrir = async () => {
    if (!monto.trim()) {
      setModalMessage('⚠️ Ingresá el monto con el que abrís la caja (puede ser 0).');
      setAdvertOpen(true);
      return;
    }

    const parsedMonto = parseFloat(monto);
    if (isNaN(parsedMonto) || parsedMonto < 0) {
      setModalMessage('⚠️ El monto no puede ser negativo.');
      setAdvertOpen(true);
      return;
    }

    try {
      // El número de caja lo asigna el servidor (siguiente de la cuenta): no se escribe.
      const r = await abrirMovimientoCaja({ monto_apertura: parsedMonto });
      setSuccessMessage(r.data?.message || 'Caja abierta correctamente.');
      setSuccessOpen(true);
      setMonto('');
      onSuccess?.();
      onClose?.();
    } catch (err: any) {
      console.error(err);
      setModalMessage(err.response?.data?.error || '  Error al abrir caja.');
      setErrorOpen(true);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">🔓 Apertura de Caja</h2>

      <p className="mb-4 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
        El número de caja se asigna solo, en orden.
      </p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Monto de Apertura *</label>
        <NumericFormat
          value={monto}
          thousandSeparator="."
          decimalSeparator=","
          decimalScale={2}
          fixedDecimalScale={false}
          allowNegative={false}
          onValueChange={(values) => {
            setMonto(values.value || '');
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
          placeholder="Ej: 500.000"
        />
      </div>

      <button
        onClick={handleAbrir}
        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 rounded-lg transition-all duration-150"
      >
        Abrir Caja
      </button>

      <ModalAdvert isOpen={advertOpen} onClose={() => setAdvertOpen(false)} message={modalMessage} />
      <ModalError isOpen={errorOpen} onClose={() => setErrorOpen(false)} message={modalMessage} />
      <ModalSuccess
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        message={successMessage}
      />
    </div>
  );
};

export default AbrirCaja;
