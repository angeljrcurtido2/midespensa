'use client';

import { useEffect, useState } from 'react';
import { type CobroDeudaProps } from '../interface';
import { pagarDeudaVenta } from '../../../services/ventas';
import ModalFormTarjeta from '../Tarjetas/ModalFormTarjeta';
import ModalFormCheque from '../Cheques/ModalFormCheque';
import { getFormasPago } from '../../../services/formasPago';
import ModalError from '../../../components/ModalError';
import ModalSuccess from '../../../components/ModalSuccess';
import ModalSeleccionarDatosBancarios from '../../../datosbancarios/components/ModalsDatosBancarios/ModalSeleccionarDatosBancarios';
import { NumericFormat } from "react-number-format";
import PlanCuotasDetalle from './PlanCuotasDetalle';
import CardText from './components/CardText';
import { formatPY } from '../../../movimiento/utils/utils';

const CobroDeudaVenta: React.FC<CobroDeudaProps> = ({
  iddeuda,
  onClose,
  onSuccess,
  setComprobante,
  setShowComprobante,
  montoMaximo = 0
}) => {
  const [monto, setMonto] = useState<number>(0);
  const [observacion, setObservacion] = useState('---');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModalError, setShowModalError] = useState(false);
  const [showModalSuccess, setShowModalSuccess] = useState(false);
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<any>(null);
  const [montoPagoParcial, setMontoPagoParcial] = useState<number | undefined>(undefined);

  const [idformapago, setIdformapago] = useState<number | null>(null);

  const [detalleTransferenciaCobro, setDetalleTransferenciaCobro] = useState<any>(null);
  const [modalSeleccionarOpen, setModalSeleccionarOpen] = useState(false);

  const [detalleTarjetaVentaCobro, setDetalleTarjetaVentaCobro] = useState<any>({
    tipo_tarjeta: '',
    entidad: '',
    monto: 0,
    observacion: ''
  });
  const [modalTarjetaOpen, setModalTarjetaOpen] = useState(false);

  const [detalleChequeVentaCobro, setDetalleChequeVentaCobro] = useState<any>({
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
  const [montoMaximoActual, setMontoMaximoActual] = useState(montoMaximo);


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

  useEffect(() => {
    if (!cuotaSeleccionada) {
      setMontoMaximoActual(montoMaximo);
    }
  }, [montoMaximo, cuotaSeleccionada]);

  const handleCuotaSeleccionada = (cuota: any | null, montoParcial?: number) => {
    setCuotaSeleccionada(cuota);
    setMontoPagoParcial(montoParcial);

    if (cuota) {
      const saldoCuota = cuota.saldo_total || 0;
      setMontoMaximoActual(saldoCuota);

      if (montoParcial && montoParcial > 0) {
        setMonto(montoParcial);
      } else {
        setMonto(saldoCuota);
      }
    } else {
      setMontoMaximoActual(montoMaximo);
      setMonto(0);
    }
  };

  const handlePago = async () => {
    if (!monto || monto <= 0) {
      setError('Ingrese un monto válido');
      return;
    }

    if (monto > montoMaximoActual) {
      setShowModalError(true);
      return;
    }

    if (!idformapago) {
      setError('Debe seleccionar una forma de pago');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await pagarDeudaVenta({
        iddeuda,
        observacion,
        idformapago,
        monto: monto,
        iddetalle_cuota: cuotaSeleccionada?.iddetalle_cuota,
        detalle_transferencia: idformapago === 2 ? detalleTransferenciaCobro : null,
        detalle_tarjeta_venta_credito: idformapago === 4 ? detalleTarjetaVentaCobro : null,
        detalle_cheque_venta_cobro: idformapago === 3 ? detalleChequeVentaCobro : null
      });

      setMensaje(response.data.message);

      if (response.data?.comprobanteBase64) {
        const base64 = response.data.comprobanteBase64;
        const binary = atob(base64);
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }

      setMonto(0);
      setComprobante && setComprobante(response.data.comprobante);
      setShowComprobante && setShowComprobante(true);
      setShowModalSuccess(true);

      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const cuotaData = cuotaSeleccionada ? [
    { title: "Capital pendiente", text: formatPY(cuotaSeleccionada.saldo_capital || 0) },
    { title: "Interés pendiente", text: formatPY(cuotaSeleccionada.saldo_interes || 0) },
    { title: "Mora", text: formatPY(cuotaSeleccionada.saldo_punitorio || 0) }
  ] : [];
return (
    <>
      <div className="w-full max-w-[900px] mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border-2 border-blue-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 mb-6 text-white">
          <h2 className="text-2xl font-bold">Cobro de Deuda</h2>
          <p className="text-blue-100 dark:text-gray-300 text-sm">Registre el pago de la deuda</p>
        </div>

        {/* Plan de Cuotas */}
        <div className="mb-6">
          <PlanCuotasDetalle
            iddeuda={iddeuda}
            modoSeleccion={true}
            onCuotaSeleccionada={handleCuotaSeleccionada}
          />
        </div>

        {/* Indicador de cuota seleccionada */}
        {cuotaSeleccionada && (
          <div
            className="
              mb-6 rounded-xl p-4 border-2
              bg-blue-50 border-blue-300
              dark:bg-gray-800 dark:border-gray-600
            "
          >
            <div className="flex items-center justify-between mb-4">
              <p
                className="
                text-sm font-semibold
                text-blue-800
                dark:text-white
              "
              >
                Cuota seleccionada: #{cuotaSeleccionada.numero_cuota}
              </p>

              {montoPagoParcial && montoPagoParcial > 0 && (
                <span
                  className="
                    text-xs px-3 py-1 rounded-full font-semibold
                    bg-blue-100 text-blue-700
                    dark:bg-gray-700 dark:text-gray-300
                  "
                >
                  Pago Parcial
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              {cuotaData.map((card, index) => (
                <CardText
                  key={index}
                  title={card.title}
                  text={card.text}
                />
              ))}
            </div>

            <div
              className="
                grid grid-cols-2 gap-3 pt-3 border-t
                border-blue-300
                dark:border-gray-600
              "
            >
              <CardText
                title="Saldo total a pagar"
                text={formatPY(cuotaSeleccionada.saldo_total)}
              />
              <CardText
                title="Monto a pagar"
                text={formatPY(monto)}
              />
            </div>
          </div>
        )}


        {/* Inputs de Monto y Observación */}
        <div className='grid grid-cols-2 gap-4 mb-4'>
          <div>
            <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-2">
              Monto a pagar
              {cuotaSeleccionada && (
                <span className="ml-2 text-xs text-blue-500 dark:text-gray-400">(definido por cuota)</span>
              )}
            </label>
            <NumericFormat
              value={monto}
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={2}
              fixedDecimalScale={false}
              allowNegative={false}
              disabled={cuotaSeleccionada !== null}
              onValueChange={(values) => {
                if (!cuotaSeleccionada) {
                  setMonto(values.floatValue || 0);
                }
              }}
              placeholder={`Máximo: ${montoMaximoActual.toLocaleString('es-PY')}`}
              className={`w-full px-4 py-2 border-2 border-blue-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                ${cuotaSeleccionada ? 'bg-blue-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-700 dark:text-gray-300 mb-2">Observación</label>
            <input
              type="text"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="N° de referencia de transacción o cheque"
              className="w-full px-4 py-2 border-2 border-blue-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Forma de Pago */}
        <div className="mb-4">
          <label
            className="
      block text-sm font-medium mb-2
      text-blue-700
      dark:text-gray-300
    "
          >
            Forma de Pago
          </label>

          <select
            value={idformapago || ''}
            onChange={e => {
              setIdformapago(Number(e.target.value));
              setDetalleTransferenciaCobro(null);
              setDetalleTarjetaVentaCobro({
                tipo_tarjeta: '',
                entidad: '',
                monto: 0,
                observacion: ''
              });
              setDetalleChequeVentaCobro({
                banco: '',
                nro_cheque: '',
                monto: 0,
                fecha_emision: '',
                fecha_vencimiento: '',
                titular: '',
                estado: 'pendiente'
              });
            }}
            className="
      w-full px-4 py-2 rounded-lg border-2
      border-blue-300
      bg-white text-gray-900
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      dark:border-gray-600 dark:bg-gray-800 dark:text-white
      dark:focus:ring-blue-400 dark:focus:border-blue-400
    "
          >
            <option value="">-- Seleccione una forma de pago --</option>
            {formasPago.map((forma) => (
              <option key={forma.idformapago} value={forma.idformapago}>
                {forma.descripcion}
              </option>
            ))}
          </select>
        </div>


        {/* Botones para Detalle */}
        {idformapago === 2 && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setModalSeleccionarOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow-md transition-all mb-3"
            >
              Seleccionar Datos Bancarios
            </button>

            {detalleTransferenciaCobro && (
              <div className="bg-blue-50 dark:bg-gray-800 border-2 border-blue-300 dark:border-gray-600 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 dark:text-white mb-3">Datos Bancarios Seleccionados</p>
                <div className="grid grid-cols-2 gap-3">
                  <CardText
                    title="Banco"
                    text={detalleTransferenciaCobro.banco_origen || '--'}
                  />
                  <CardText
                    title="Nro. Cuenta"
                    text={detalleTransferenciaCobro.numero_cuenta || '--'}
                  />
                  <CardText
                    title="Tipo Cuenta"
                    text={detalleTransferenciaCobro.tipo_cuenta || '--'}
                  />
                  <CardText
                    title="Titular"
                    text={detalleTransferenciaCobro.titular_cuenta || '--'}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {idformapago === 4 && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setModalTarjetaOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow-md transition-all mb-3"
            >
              Agregar Detalle de Tarjeta
            </button>

            {detalleTarjetaVentaCobro.tipo_tarjeta && (
              <div className="bg-blue-50 dark:bg-gray-800 border-2 border-blue-300 dark:border-gray-600 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 dark:text-white mb-3">Datos de Tarjeta</p>
                <div className="grid grid-cols-2 gap-3">
                  <CardText
                    title="Tipo de Tarjeta"
                    text={detalleTarjetaVentaCobro.tipo_tarjeta || '--'}
                  />
                  <CardText
                    title="Entidad"
                    text={detalleTarjetaVentaCobro.entidad || '--'}
                  />
                  <CardText
                    title="Monto"
                    text={formatPY(detalleTarjetaVentaCobro.monto || 0)}
                  />
                  {detalleTarjetaVentaCobro.observacion && (
                    <CardText
                      title="Observación"
                      text={detalleTarjetaVentaCobro.observacion}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {idformapago === 3 && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setModalChequeOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow-md transition-all mb-3"
            >
              Agregar Detalle de Cheque
            </button>

            {detalleChequeVentaCobro.banco && (
              <div className="bg-blue-50 dark:bg-gray-800 border-2 border-blue-300 dark:border-gray-600 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 dark:text-white mb-3">Datos del Cheque</p>
                <div className="grid grid-cols-2 gap-3">
                  <CardText
                    title="Banco"
                    text={detalleChequeVentaCobro.banco || '--'}

                  />
                  <CardText
                    title="Nro. Cheque"
                    text={detalleChequeVentaCobro.nro_cheque || '--'}

                  />
                  <CardText
                    title="Monto"
                    text={formatPY(detalleChequeVentaCobro.monto || 0)}

                  />
                  <CardText
                    title="Titular"
                    text={detalleChequeVentaCobro.titular || '--'}

                  />
                  <CardText
                    title="Fecha Emisión"
                    text={detalleChequeVentaCobro.fecha_emision || '--'}

                  />
                  <CardText
                    title="Fecha Vencimiento"
                    text={detalleChequeVentaCobro.fecha_vencimiento || '--'}

                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje de error inline */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-blue-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="text-sm text-blue-600 dark:text-gray-400 hover:text-blue-800 dark:hover:text-gray-300 font-medium transition"
          >
            Cancelar
          </button>

          <button
            onClick={handlePago}
            disabled={loading}
            className="
                px-6 py-2.5 rounded-lg shadow-md font-semibold transition-all
                text-white
                bg-blue-600 hover:bg-blue-700
                disabled:opacity-50 disabled:cursor-not-allowed
                dark:bg-gray-700 dark:hover:bg-gray-600
                dark:disabled:bg-gray-800
              "
          >
            {loading ? 'Procesando...' : 'Registrar Pago'}
          </button>

        </div>
      </div>

      {/* Modales */}
      <ModalError
        message={`El monto ingresado supera el permitido. Máximo: ${formatPY(montoMaximoActual)}`}
        onClose={() => setShowModalError(false)}
        isOpen={showModalError}
      />

      <ModalSuccess
        message={mensaje || "Pago registrado exitosamente"}
        onClose={() => setShowModalSuccess(false)}
        isOpen={showModalSuccess}
      />

      <ModalSeleccionarDatosBancarios
        isOpen={modalSeleccionarOpen}
        onClose={() => setModalSeleccionarOpen(false)}
        onSelect={(dato: any) => {
          setDetalleTransferenciaCobro(dato);
          setModalSeleccionarOpen(false);
        }}
      />

      <ModalFormTarjeta
        isOpen={modalTarjetaOpen}
        onClose={() => setModalTarjetaOpen(false)}
        datosTarjeta={detalleTarjetaVentaCobro}
        setDatosTarjeta={setDetalleTarjetaVentaCobro}
      />

      <ModalFormCheque
        isOpen={modalChequeOpen}
        onClose={() => setModalChequeOpen(false)}
        datosCheque={detalleChequeVentaCobro}
        setDatosCheque={setDetalleChequeVentaCobro}
      />
    </>
  );
};

export default CobroDeudaVenta;