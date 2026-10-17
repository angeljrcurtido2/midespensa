'use client';

import { type FC } from 'react';
import { FaMoneyBillWave, FaUniversity, FaCreditCard, FaMoneyCheck } from 'react-icons/fa';
import CardText from './CardText';
import { formatPY } from '../../../../movimiento/utils/utils';

interface DetallePago {
  idpago_deuda: number;
  monto_pagado: string;
  fecha_pago: string;
  observacion: string;
  idformapago: number;
  transferencia_banco_origen?: string | null;
  transferencia_numero_cuenta?: string | null;
  transferencia_tipo_cuenta?: string | null;
  transferencia_titular_cuenta?: string | null;
  transferencia_observacion?: string | null;
  tarjeta_tipo_tarjeta?: string | null;
  tarjeta_entidad?: string | null;
  tarjeta_monto?: string | null;
  tarjeta_observacion?: string | null;
  cheque_banco?: string | null;
  cheque_nro_cheque?: string | null;
  cheque_monto?: string | null;
  cheque_fecha_emision?: string | null;
  cheque_fecha_vencimiento?: string | null;
  cheque_titular?: string | null;
  cheque_estado?: string | null;
}

interface Props {
  pago: DetallePago;
}

const formaPagoTexto = (id: number) => {
  switch (id) {
    case 1: return "Efectivo";
    case 2: return "Transferencia";
    case 3: return "Tarjeta";
    case 4: return "Cheque";
    default: return "Desconocido";
  }
};

const formaPagoIcono = (id: number) => {
  switch (id) {
    case 1: return <FaMoneyBillWave className="text-white-600 dark:text-gray-300" />;
    case 2: return <FaUniversity className="text-white-600 dark:text-gray-300" />;
    case 3: return <FaCreditCard className="text-white-600 dark:text-gray-300" />;
    case 4: return <FaMoneyCheck className="text-white-600 dark:text-gray-300" />;
    default: return null;
  }
};

const DetallePagoDeudas: FC<Props> = ({ pago }) => {
  const { idformapago } = pago;

  const styleCardSmall = "bg-blue-50 dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-gray-600";
  const styleTxtCards = "text-xs text-blue-600 dark:text-gray-400 font-medium mb-1";
  const styleTxtLabelBold = "text-sm font-bold text-blue-700 dark:text-white";

  const renderDetalleMetodoPago = () => {
    switch (idformapago) {
      case 1:
        return (
          <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-gray-600 text-center">
            <p className="text-blue-700 dark:text-white font-medium">Pago realizado en efectivo</p>
          </div>
        );
      case 2:
        const transferenciaData = [
          { title: "Banco origen", text: pago.transferencia_banco_origen || '--' },
          { title: "Nro. cuenta", text: pago.transferencia_numero_cuenta || '--' },
          { title: "Tipo cuenta", text: pago.transferencia_tipo_cuenta || '--' },
          { title: "Titular", text: pago.transferencia_titular_cuenta || '--' }
        ];
        return (
          <div className="grid grid-cols-2 gap-3">
            {transferenciaData.map((card, index) => (
              <CardText
                key={index}
                title={card.title}
                text={card.text}
                containerClass={styleCardSmall}
                titleClass={styleTxtCards}
                textClass={styleTxtLabelBold}
              />
            ))}
            {pago.transferencia_observacion && (
              <div className="col-span-2">
                <CardText
                  title="Observación"
                  text={pago.transferencia_observacion}
                  containerClass={styleCardSmall}
                  titleClass={styleTxtCards}
                  textClass={styleTxtLabelBold}
                />
              </div>
            )}
          </div>
        );
      case 3:
        const tarjetaData = [
          { title: "Tipo tarjeta", text: pago.tarjeta_tipo_tarjeta || '--' },
          { title: "Entidad", text: pago.tarjeta_entidad || '--' },
          { title: "Monto", text: pago.tarjeta_monto ? formatPY(pago.tarjeta_monto) : '--' }
        ];
        return (
          <div className="grid grid-cols-2 gap-3">
            {tarjetaData.map((card, index) => (
              <CardText
                key={index}
                title={card.title}
                text={card.text}
                containerClass={styleCardSmall}
                titleClass={styleTxtCards}
                textClass={styleTxtLabelBold}
              />
            ))}
            {pago.tarjeta_observacion && (
              <div className="col-span-2">
                <CardText
                  title="Observación"
                  text={pago.tarjeta_observacion}
                  containerClass={styleCardSmall}
                  titleClass={styleTxtCards}
                  textClass={styleTxtLabelBold}
                />
              </div>
            )}
          </div>
        );
      case 4:
        const chequeData = [
          { title: "Banco", text: pago.cheque_banco || '--' },
          { title: "Nro. Cheque", text: pago.cheque_nro_cheque || '--' },
          { title: "Monto", text: pago.cheque_monto ? formatPY(pago.cheque_monto) : '--' },
          { title: "Emisión", text: pago.cheque_fecha_emision || '--' },
          { title: "Vencimiento", text: pago.cheque_fecha_vencimiento || '--' },
          { title: "Titular", text: pago.cheque_titular || '--' },
          { title: "Estado", text: pago.cheque_estado || '--' }
        ];
        return (
          <div className="grid grid-cols-2 gap-3">
            {chequeData.map((card, index) => (
              <CardText
                key={index}
                title={card.title}
                text={card.text}
                containerClass={styleCardSmall}
                titleClass={styleTxtCards}
                textClass={styleTxtLabelBold}
              />
            ))}
          </div>
        );
      default:
        return (
          <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-gray-600 text-center">
            <p className="text-blue-500 dark:text-gray-400 italic">Sin detalle específico de la forma de pago</p>
          </div>
        );
    }
  };

  const infoPagoData = [
    { title: "Monto pagado", text: formatPY(pago.monto_pagado) },
    { title: "Fecha de pago", text: new Date(pago.fecha_pago).toLocaleString('es-PY') },
    { title: "Observación", text: pago.observacion || '--' }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 max-w-3xl mx-auto border-2 border-blue-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 mb-6 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 dark:bg-gray-600/30 p-3 rounded-lg">
            {formaPagoIcono(idformapago)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Detalle del Pago</h2>
            <p className="text-blue-100 dark:text-gray-300 text-sm">Método: {formaPagoTexto(idformapago)}</p>
          </div>
        </div>
      </div>

      {/* Información general */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {infoPagoData.map((card, index) => (
          <CardText
            key={index}
            title={card.title}
            text={card.text}
            containerClass={styleCardSmall}
            titleClass={styleTxtCards}
            textClass={styleTxtLabelBold}
          />
        ))}
      </div>

      {/* Detalles específicos del método de pago */}
      <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-xl border-2 border-blue-200 dark:border-gray-600">
        <h3 className="text-blue-700 dark:text-white font-semibold mb-3 flex items-center gap-2">
          {formaPagoIcono(idformapago)}
          Detalles específicos
        </h3>
        {renderDetalleMetodoPago()}
      </div>
    </div>
  );
};

export default DetallePagoDeudas;