interface ModalComprobantePagoProps {
  comprobante: {
    cliente: string;
    proveedor?: string;
    fecha_pago: string;
    monto_pagado: string;
    tipoPago?: string;
    saldo: string;
    detallesVenta: {
      idproducto: number;
      producto: string;
      cantidad: string;
      precio_venta?: string;
      precio?: string;
      sub_total: string;
    }[];
    detallesCompra?: {
      idproducto: number;
      producto: string;
      cantidad: string;
      precio?: string;
      precio_venta?:string;
      sub_total: string;
    }[];
  };
  onClose: () => void;
  isProviderPay?: boolean;
}
const titleSell = "Detalle de Venta la cual se esta realizando el pago a credito"
const titleBuy = "Detalle de Compra la cual se esta realizando el pago a credito"
const ModalComprobantePago: React.FC<ModalComprobantePagoProps> = ({ comprobante, onClose, isProviderPay = false }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-900 w-[500px] rounded-lg p-6 shadow-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-center text-gray-900 dark:text-white">Comprobante de Pago</h2>
        <p className="text-gray-800 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">{`${isProviderPay ? "Proveedor" : "Cliente"}`}:</strong> {isProviderPay ? comprobante.proveedor : comprobante.cliente}</p>
        <p className="text-gray-800 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Fecha de Pago:</strong> {new Date(comprobante.fecha_pago).toLocaleDateString()}</p>
        <p className="text-gray-800 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Monto Pagado:</strong> {comprobante.monto_pagado} Gs</p>
        <p className="text-gray-800 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Tipo de Pago:</strong> {comprobante.tipoPago}</p>
        <p className="text-gray-800 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Saldo Pendiente:</strong> {comprobante.saldo} Gs</p>

        <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{isProviderPay ? titleBuy : titleSell}</h3>
        <table className="w-full text-sm mt-2 border border-gray-300 dark:border-gray-600">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-2 py-1 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">Producto</th>
              <th className="px-2 py-1 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">Cantidad</th>
              <th className="px-2 py-1 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">Precio</th>
              <th className="px-2 py-1 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">Subtotal</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900">
            {(isProviderPay
              ? comprobante.detallesCompra ?? [] 
              : comprobante.detallesVenta
            ).map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-gray-800 dark:text-gray-300">{item.producto}</td>
                <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-gray-800 dark:text-gray-300">{item.cantidad}</td>
                <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-gray-800 dark:text-gray-300">
                  {isProviderPay ? item.precio ?? 0 : item.precio_venta ?? 0}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-gray-800 dark:text-gray-300">{item.sub_total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="bg-blue-600 dark:bg-gray-700 hover:bg-blue-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded shadow transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalComprobantePago;
