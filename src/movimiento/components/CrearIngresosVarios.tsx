'use client';

import { useState, useEffect } from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';
import ModalListarTiposIngreso from './ModalMovimiento/ModalListarTiposIngreso';
import ModalAdvert from '../../components/ModalAdvert';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import ModalSeleccionarDatosBancarios from '../../datosbancarios/components/ModalsDatosBancarios/ModalSeleccionarDatosBancarios';
import ModalFormTarjeta from '../../ventas/components/Tarjetas/ModalFormTarjeta';
import ModalFormCheque from '../../ventas/components/Cheques/ModalFormCheque';
import { registrarIngreso } from '../../services/ingreso';
import { getFormasPago } from '../../services/formasPago';
import CardText from '../../ventas/components/CobroDeudaVenta/components/CardText';

interface TipoIngreso {
  idtipo_ingreso: number;
  descripcion: string;
}

interface CrearIngresosVariosProps {
  onSuccess?: () => void;
  onClose: () => void;
}

const CrearIngresosVarios = ({ onSuccess, onClose }: CrearIngresosVariosProps) => {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoIngreso | null>(null);
  const [modalSeleccionarOpen, setModalSeleccionarOpen] = useState(false);
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [observacion, setObservacion] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);

  const [advertOpen, setAdvertOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Estados para métodos de pago
  const [formasPago, setFormasPago] = useState<any[]>([]);
  const [idformapago, setIdformapago] = useState<number | null>(null);

  // Estados para transferencia
  const [modalSeleccionarBancoOpen, setModalSeleccionarBancoOpen] = useState(false);
  const [detalleTransferencia, setDetalleTransferencia] = useState<any>(null);

  // Estados para tarjeta
  const [modalTarjetaOpen, setModalTarjetaOpen] = useState(false);
  const [detalleTarjeta, setDetalleTarjeta] = useState({
    tipo_tarjeta: '',
    entidad: '',
    monto: 0,
    observacion: ''
  });

  // Estados para cheque
  const [modalChequeOpen, setModalChequeOpen] = useState(false);
  const [detalleCheque, setDetalleCheque] = useState({
    banco: '',
    nro_cheque: '',
    monto: 0,
    fecha_emision: '',
    fecha_vencimiento: '',
    titular: '',
    estado: 'pendiente'
  });


  useEffect(() => {
    const fetchFormasPago = async () => {
      try {
        const res = await getFormasPago();
        setFormasPago(res.data);
      } catch (err) {
        console.error("Error al obtener formas de pago", err);
      }
    };
    fetchFormasPago();
  }, []);

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
      await registrarIngreso({
        idtipo_ingreso: tipoSeleccionado.idtipo_ingreso,
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
      setModalMessage(err.response?.data?.error || '  Error al registrar ingreso.');
      setErrorOpen(true);
    }
  };

return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-blue-200 dark:border-gray-700 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 dark:bg-gray-800 p-3 rounded-lg">
          <FaMoneyBillWave className="text-blue-600 dark:text-blue-400 text-2xl" />
        </div>
        <h2 className="text-2xl font-bold text-blue-800 dark:text-white">Registrar Ingreso Manual</h2>
      </div>

      {/* Formulario Principal */}
      <div className="space-y-4">
        <div className="flex flex-row gap-3">
          {/* Tipo de Ingreso */}
          <div className='mt-1'>
            <label className="text-sm font-medium text-blue-700 dark:text-gray-300 mb-2">Tipo de Ingreso *</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tipoSeleccionado?.descripcion || ''}
                readOnly
                placeholder="Seleccione tipo de ingreso..."
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                onClick={() => setModalSeleccionarOpen(true)}
              />
         
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-2">Monto *</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="Ej: 100000"
            />
          </div>
        </div>

        {/* Concepto */}
        <div>
          <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-2">Concepto *</label>
          <input
            type="text"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="Ej: Ingreso por venta contado ID 71"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Observación */}
          <div>
            <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-2">Observación (opcional)</label>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="Ej: Venta al contado registrada"
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-2">Fecha del Ingreso *</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Forma de Pago */}
        <div>
          <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-2">Forma de Pago</label>
          <select
            value={idformapago || ''}
            onChange={e => {
              setIdformapago(Number(e.target.value));
              setDetalleTransferencia(null);
              setDetalleTarjeta({
                tipo_tarjeta: '',
                entidad: '',
                monto: 0,
                observacion: ''
              });
              setDetalleCheque({
                banco: '',
                nro_cheque: '',
                monto: 0,
                fecha_emision: '',
                fecha_vencimiento: '',
                titular: '',
                estado: 'pendiente'
              });
            }}
            className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
          >
            <option value="">-- Seleccione una forma de pago --</option>
            {formasPago.map((forma) => (
              <option key={forma.idformapago} value={forma.idformapago}>
                {forma.descripcion}
              </option>
            ))}
          </select>
        </div>

        {/* Detalles de Transferencia */}
        {idformapago === 2 && (
          <div className="bg-blue-50 dark:bg-gray-800 rounded-xl p-4 border border-blue-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-white mb-3">Datos Bancarios</h3>

            <button
              type="button"
              onClick={() => setModalSeleccionarBancoOpen(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium mb-3"
            >
              Seleccionar Datos Bancarios
            </button>

            {detalleTransferencia && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <CardText
                    title="Banco"
                    text={detalleTransferencia.banco_origen || 'N/A'}
                  />
                  <CardText
                    title="Nro. Cuenta"
                    text={detalleTransferencia.numero_cuenta || 'N/A'}
                  />
                  <CardText
                    title="Tipo"
                    text={detalleTransferencia.tipo_cuenta || 'N/A'}
                  />
                  <CardText
                    title="Titular"
                    text={detalleTransferencia.titular_cuenta || 'N/A'}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setModalSeleccionarBancoOpen(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  Cambiar datos bancarios
                </button>
              </div>
            )}

          </div>
        )}

        {/* Detalles de Tarjeta */}
        {idformapago === 4 && (
          <div className="bg-blue-50 dark:bg-gray-800 rounded-xl p-4 border border-blue-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-white mb-3">Detalle de Tarjeta</h3>

            <button
              type="button"
              onClick={() => setModalTarjetaOpen(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium mb-3"
            >
              Agregar Detalle de Tarjeta
            </button>

            {detalleTarjeta.tipo_tarjeta && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <CardText
                    title="Tipo"
                    text={detalleTarjeta.tipo_tarjeta}
                  />
                  <CardText
                    title="Entidad"
                    text={detalleTarjeta.entidad}
                  />
                  <CardText
                    title="Monto"
                    text={`₲ ${parseInt(detalleTarjeta.monto.toString()).toLocaleString('es-PY')}`}
                  />
                  <CardText
                    title="Observación"
                    text={detalleTarjeta.observacion || 'N/A'}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setModalTarjetaOpen(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  Editar detalle de tarjeta
                </button>
              </div>
            )}
          </div>
        )}

        {/* Detalles de Cheque */}
        {idformapago === 3 && (
          <div className="bg-blue-50 dark:bg-gray-800 rounded-xl p-4 border border-blue-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-white mb-3">Detalle de Cheque</h3>

            <button
              type="button"
              onClick={() => setModalChequeOpen(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium mb-3"
            >
              Agregar Detalle de Cheque
            </button>

            {detalleCheque.banco && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <CardText
                    title="Banco"
                    text={detalleCheque.banco}
                  />
                  <CardText
                    title="Nro. Cheque"
                    text={detalleCheque.nro_cheque}
                  />
                  <CardText
                    title="Monto"
                    text={`₲ ${parseInt(detalleCheque.monto.toString()).toLocaleString('es-PY')}`}
                  />
                  <CardText
                    title="Titular"
                    text={detalleCheque.titular}
                  />
                  <CardText
                    title="Fecha Emisión"
                    text={new Date(detalleCheque.fecha_emision).toLocaleDateString('es-PY')}
                  />
                  <CardText
                    title="Fecha Vencimiento"
                    text={new Date(detalleCheque.fecha_vencimiento).toLocaleDateString('es-PY')}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setModalChequeOpen(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  Editar detalle de cheque
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-blue-100 dark:border-gray-700">
        <button
          onClick={onClose}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium"
        >
          Cancelar
        </button>

        <button
          onClick={handleCrear}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
        >
          Registrar Ingreso
        </button>
      </div>

      {/* Modales */}
      <ModalListarTiposIngreso
        onSelect={(tipo) => {
          setTipoSeleccionado(tipo);
          setModalSeleccionarOpen(false);
        }}
        isOpen={modalSeleccionarOpen}
        onClose={() => setModalSeleccionarOpen(false)}
      />

      <ModalSeleccionarDatosBancarios
        isOpen={modalSeleccionarBancoOpen}
        onClose={() => setModalSeleccionarBancoOpen(false)}
        onSelect={(dato) => {
          setDetalleTransferencia(dato);
          setModalSeleccionarBancoOpen(false);
        }}
      />

      <ModalFormTarjeta
        isOpen={modalTarjetaOpen}
        onClose={() => setModalTarjetaOpen(false)}
        datosTarjeta={detalleTarjeta}
        setDatosTarjeta={setDetalleTarjeta}
      />

      <ModalFormCheque
        isOpen={modalChequeOpen}
        onClose={() => setModalChequeOpen(false)}
        datosCheque={detalleCheque}
        setDatosCheque={setDetalleCheque}
      />

      <ModalAdvert isOpen={advertOpen} onClose={() => setAdvertOpen(false)} message={modalMessage} />
      <ModalError isOpen={errorOpen} onClose={() => setErrorOpen(false)} message={modalMessage} />
      <ModalSuccess
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        message="Ingreso registrado correctamente"
      />
    </div>
  );
};

export default CrearIngresosVarios;
