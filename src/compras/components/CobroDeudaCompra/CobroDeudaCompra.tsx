'use client';

import { useEffect, useState } from 'react';
import { FaMoneyBillWave, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import ModalError from '../../../components/ModalError';
import ModalSeleccionarDatosBancarios from '../../../datosbancarios/components/ModalsDatosBancarios/ModalSeleccionarDatosBancarios';
import ModalFormTarjeta from '../../../ventas/components/Tarjetas/ModalFormTarjeta';
import ModalFormCheque from'../../../ventas/components/Cheques/ModalFormCheque';
import { getFormasPago } from '../../../services/formasPago';
import { pagarDeudaCompra } from '../../../services/compras';
import type { CobroDeudaProps } from '../../../ventas/components/interface';
import CardText from '../../../ventas/components/CobroDeudaVenta/components/CardText';

const CobroDeudaCompra: React.FC<CobroDeudaProps> = ({
  iddeuda,
  onClose,
  onSuccess,
  setComprobante,
  setShowComprobante,
  montoMaximo = 0
}) => {
  const [monto, setMonto] = useState('');
  const [observacion, setObservacion] = useState('---');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModalError, setShowModalError] = useState(false);

  const [idformapago, setIdformapago] = useState<number | null>(null);

  const [detalleTransferenciaPago, setDetalleTransferenciaPago] = useState<any>(null);
  const [modalSeleccionarOpen, setModalSeleccionarOpen] = useState(false);

  const [detalleTarjetaCompra, setDetalleTarjetaCompra] = useState<any>({
    tipo_tarjeta: '',
    entidad: '',
    monto: 0,
    observacion: ''
  });
  const [modalTarjetaOpen, setModalTarjetaOpen] = useState(false);

  const [detalleChequeCompra, setDetalleChequeCompra] = useState<any>({
    banco: '',
    nro_cheque: '',
    monto: 0,
    fecha_emision: '',
    fecha_vencimiento: '',
    titular: '',
    estado: 'pendiente'
  });
  const [modalChequeOpen, setModalChequeOpen] = useState(false);

  const [formasPago, setFormasPago] = useState<any[]>([]);


  useEffect(() => {
    const fetchFormasPago = async () => {
      try {
        const res = await getFormasPago();
        setFormasPago(res.data);
      } catch (err) {
        console.error("  Error al obtener formas de pago", err);
      }
    };

    fetchFormasPago();
  }, []);

  const handlePago = async () => {
    const valor = parseFloat(monto);
    if (!monto || isNaN(valor) || valor <= 0) {
      setError('  Ingrese un monto válido.');
      return;
    }

    if (valor > montoMaximo) {
      setShowModalError(true);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await pagarDeudaCompra({
        iddeuda,
        observacion,
        idformapago,
        monto: valor,
        detalle_transferencia_pago: idformapago === 2 ? detalleTransferenciaPago : null,
        detalle_tarjeta_compra_pago: idformapago === 4 ? detalleTarjetaCompra : null,
        detalle_cheque_compra_pago: idformapago === 3 ? detalleChequeCompra : null
      });

      setMensaje(response.data.message);
      setMonto('');
      setComprobante && setComprobante(response.data.comprobante);
      setShowComprobante && setShowComprobante(true);
      onSuccess?.();
      onClose?.();
    } catch (error: any) {
      setError(error.response?.data?.error || '  Error al registrar el pago.');
    } finally {
      setLoading(false);
    }
  };

 return (
    <>
      <div className="w-full max-w-[700px] mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-blue-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 dark:bg-gray-500 dark:rounded-lg dark:text-white p-3">
          <div className="bg-blue-100 dark:bg-gray-800 p-3 rounded-lg">
            <FaMoneyBillWave className="text-blue-600 dark:text-gray-400 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-blue-800 dark:text-white">Pago de Deuda de Compra</h2>
        </div>
        {/* Formulario Principal */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-2">Monto a pagar</label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder={`Máximo: ${montoMaximo.toFixed(2)}`}
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
            

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-2">Observación</label>
              <input
                type="text"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Referencia del pago"
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-2">Forma de Pago</label>
            <select
              value={idformapago || ''}
              onChange={e => {
                setIdformapago(Number(e.target.value));
                setDetalleTransferenciaPago(null);
                setDetalleTarjetaCompra({
                  tipo_tarjeta: '',
                  entidad: '',
                  monto: 0,
                  observacion: ''
                });
                setDetalleChequeCompra({
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
              {!detalleTransferenciaPago ? (
                <button
                  type="button"
                  onClick={() => setModalSeleccionarOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
                >
                  Seleccionar Datos Bancarios
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <CardText
                      title="Banco"
                      text={detalleTransferenciaPago.banco_origen || 'N/A'}

                    />
                    <CardText
                      title="Nro. Cuenta"
                      text={detalleTransferenciaPago.numero_cuenta || 'N/A'}

                    />
                    <CardText
                      title="Tipo"
                      text={detalleTransferenciaPago.tipo_cuenta || 'N/A'}

                    />
                    <CardText
                      title="Titular"
                      text={detalleTransferenciaPago.titular_cuenta || 'N/A'}

                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalSeleccionarOpen(true)}
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
              {!detalleTarjetaCompra.tipo_tarjeta ? (
                <button
                  type="button"
                  onClick={() => setModalTarjetaOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
                >
                  Agregar Detalle de Tarjeta
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <CardText
                      title="Tipo"
                      text={detalleTarjetaCompra.tipo_tarjeta}

                    />
                    <CardText
                      title="Entidad"
                      text={detalleTarjetaCompra.entidad}

                    />
                    <CardText
                      title="Monto"
                      text={`₲ ${parseInt(detalleTarjetaCompra.monto.toString()).toLocaleString('es-PY')}`}

                    />
                    <CardText
                      title="Observación"
                      text={detalleTarjetaCompra.observacion || 'N/A'}

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
              {!detalleChequeCompra.banco ? (
                <button
                  type="button"
                  onClick={() => setModalChequeOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
                >
                  Agregar Detalle de Cheque
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <CardText
                      title="Banco"
                      text={detalleChequeCompra.banco}

                    />
                    <CardText
                      title="Nro. Cheque"
                      text={detalleChequeCompra.nro_cheque}

                    />
                    <CardText
                      title="Monto"
                      text={`₲ ${parseInt(detalleChequeCompra.monto.toString()).toLocaleString('es-PY')}`}

                    />
                    <CardText
                      title="Titular"
                      text={detalleChequeCompra.titular}

                    />
                    <CardText
                      title="Fecha Emisión"
                      text={new Date(detalleChequeCompra.fecha_emision).toLocaleDateString('es-PY')}

                    />
                    <CardText
                      title="Fecha Vencimiento"
                      text={new Date(detalleChequeCompra.fecha_vencimiento).toLocaleDateString('es-PY')}
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

        {/* Mensajes */}
        {mensaje && (
          <div className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700">
            <FaCheckCircle className="text-lg flex-shrink-0" />
            <span>{mensaje}</span>
          </div>
        )}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-700">
            <FaTimesCircle className="text-lg flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-blue-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium"
          >
            Cancelar
          </button>

          <button
            onClick={handlePago}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : 'Registrar Pago'}
          </button>
        </div>
      </div>
      <ModalError
        message={`El monto ingresado supera el permitido. Máximo: ${montoMaximo.toFixed(2)}.`}
        onClose={() => setShowModalError(false)}
        isOpen={showModalError}
      />

      <ModalSeleccionarDatosBancarios
        isOpen={modalSeleccionarOpen}
        onClose={() => setModalSeleccionarOpen(false)}
        onSelect={(dato: any) => {
          setDetalleTransferenciaPago(dato);
          setModalSeleccionarOpen(false);
        }}
      />

      <ModalFormTarjeta
        isOpen={modalTarjetaOpen}
        onClose={() => setModalTarjetaOpen(false)}
        datosTarjeta={detalleTarjetaCompra}
        setDatosTarjeta={setDetalleTarjetaCompra}
      />

      <ModalFormCheque
        isOpen={modalChequeOpen}
        onClose={() => setModalChequeOpen(false)}
        datosCheque={detalleChequeCompra}
        setDatosCheque={setDetalleChequeCompra}
      />
    </>
  );
};

export default CobroDeudaCompra;