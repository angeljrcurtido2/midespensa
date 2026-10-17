import { type FC, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { FaMoneyBillWave, FaTag, FaCheckCircle, FaCreditCard, FaMoneyBill, FaExclamationTriangle, FaCheck } from 'react-icons/fa';

interface TotalVentaProps { total: number; descuento_total: number; recargo_total: number; }

const TotalVenta: FC<TotalVentaProps> = ({ total, descuento_total, recargo_total }) => {
  const [montoCliente, setMontoCliente] = useState(0);
  const tieneDescuento = descuento_total > 0;
  const tieneRecargo = recargo_total > 0;
  const totalFinal = Math.max(0, total - descuento_total + recargo_total);
  const vuelto = Math.max(0, montoCliente - totalFinal);
  const pagoCompleto = montoCliente >= totalFinal && montoCliente > 0;

  return <div className="w-full border-b-2 border-blue-200 bg-gradient-to-r from-slate-50 via-blue-50 to-slate-50 p-3 shadow-md dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-gray-200"><FaMoneyBillWave /> Resumen</div>
      <div className="rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"><span className="mr-2 text-xs text-slate-500">{tieneDescuento || tieneRecargo ? 'Subtotal' : 'Total'}</span><strong>{total.toLocaleString('es-PY')} Gs.</strong></div>
      {(tieneDescuento || tieneRecargo) && <>
        <div className={tieneRecargo ? 'rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700' : 'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600'}><FaTag className="mr-1 inline" />{tieneRecargo ? 'Recargo +' : 'Descuento -'}{(tieneRecargo ? recargo_total : descuento_total).toLocaleString('es-PY')} Gs.</div>
        <div className="rounded-lg border-2 border-green-300 bg-green-50 px-3 py-2 font-bold text-green-700"><FaCheckCircle className="mr-1 inline" />Total {totalFinal.toLocaleString('es-PY')} Gs.</div>
      </>}
      <label className="flex items-center gap-2 rounded-lg border-2 border-blue-300 bg-blue-50 px-3 py-2 text-blue-700"><FaCreditCard />Recibido:<NumericFormat value={montoCliente} thousandSeparator="." decimalSeparator="," decimalScale={0} allowNegative={false} onValueChange={v => setMontoCliente(v.floatValue || 0)} className="w-28 rounded border px-2 py-1 text-right" placeholder="0" />Gs.</label>
      {montoCliente > 0 && <div className={pagoCompleto ? 'font-semibold text-green-700' : 'font-semibold text-red-600'}>{pagoCompleto ? vuelto > 0 ? <><FaMoneyBill className="mr-1 inline" />Vuelto: {vuelto.toLocaleString('es-PY')} Gs.</> : <><FaCheck className="mr-1 inline" />Pago exacto</> : <><FaExclamationTriangle className="mr-1 inline" />Faltan: {(totalFinal - montoCliente).toLocaleString('es-PY')} Gs.</>}</div>}
    </div>
  </div>;
};
export default TotalVenta;
