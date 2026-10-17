'use client';

import { useState } from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';
import ModalListarTiposEgreso from '../ModalMovimiento/Egreso/ModalListarTiposEgreso';
import ModalAdvert from '../../../components/ModalAdvert';
import ModalError from '../../../components/ModalError';
import ModalSuccess from '../../../components/ModalSuccess';
import { registrarEgreso } from '../../../services/egreso';

interface TipoEgreso {
  idtipo_egreso: number;
  descripcion: string;
}

interface CrearEgresosVariosProps {
  onSuccess?: () => void;
  onClose: () => void;
}

const CrearEgresosVarios = ({ onSuccess, onClose }: CrearEgresosVariosProps) => {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoEgreso | null>(null);
  const [modalSeleccionarOpen, setModalSeleccionarOpen] = useState(false);
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [observacion, setObservacion] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);

  const [advertOpen, setAdvertOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleCrear = async () => {
    if (!tipoSeleccionado || !monto.trim() || !concepto.trim()) {
      setModalMessage('⚠️ Tipo, monto y concepto son obligatorios.');
      setAdvertOpen(true);
      return;
    }

    const parsedMonto = parseFloat(monto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      setModalMessage('⚠️ El monto debe ser mayor que cero.');
      setAdvertOpen(true);
      return;
    }

    try {
      await registrarEgreso({
        idtipo_egreso: tipoSeleccionado.idtipo_egreso,
        monto: parsedMonto,
        concepto: concepto.trim(),
        observacion: observacion.trim(),
        fecha,
      });

      setSuccessOpen(true);
      setMonto('');
      setConcepto('');
      setObservacion('');
      setFecha(new Date().toISOString().split('T')[0]);
      setTipoSeleccionado(null);
      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err: any) {
      console.error(err);
      setModalMessage(err.response?.data?.error || '  Error al registrar egreso.');
      setErrorOpen(true);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 dark:bg-gray-800 p-3 rounded-lg">
          <FaMoneyBillWave className="text-blue-600 dark:text-blue-400 text-2xl" />
        </div>
        <h2 className="text-2xl font-bold text-blue-800 dark:text-white">Registrar Egreso Manual</h2>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-1">Tipo de Egreso *</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tipoSeleccionado?.descripcion || ''}
            readOnly
            placeholder="Seleccione tipo de egreso..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            onClick={() => setModalSeleccionarOpen(true)}
          />

        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-1">Monto *</label>
        <input
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          placeholder="Ej: 150000"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-1">Concepto *</label>
        <input
          type="text"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          placeholder="Ej: Pago de compra ID 50"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-1">Observación (opcional)</label>
        <textarea
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          placeholder="Ej: Compra registrada con ID 50"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-1">Fecha del Egreso *</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
        />
      </div>

      <button
        onClick={handleCrear}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white font-medium py-2 rounded-lg transition-all duration-150"
      >
        Registrar Egreso
      </button>

      <ModalListarTiposEgreso
        onSelect={(tipo) => {
          setTipoSeleccionado(tipo);
          setModalSeleccionarOpen(false);
        }}
        isOpen={modalSeleccionarOpen}
        onClose={() => setModalSeleccionarOpen(false)}
      />

      <ModalAdvert isOpen={advertOpen} onClose={() => setAdvertOpen(false)} message={modalMessage} />
      <ModalError isOpen={errorOpen} onClose={() => setErrorOpen(false)} message={modalMessage} />
      <ModalSuccess
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        message="  Egreso registrado correctamente."
      />
    </div>
  );
};

export default CrearEgresosVarios;
