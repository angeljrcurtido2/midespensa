'use client';

import React, { useEffect, useState } from 'react';
import { XMarkIcon, ShoppingBagIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { comprobanteVenta } from '../../../services/ventas';
import { formatPY } from '../../../movimiento/utils/utils';
import ModalError from '../../../components/ModalError';
import CardText from '../CobroDeudaVenta/components/CardText';

interface DetalleVenta {
  iddetalle: number;
  nombre_producto: string;
  atributos_texto?: string | null;
  cantidad: string;
  precio_venta: string;
  sub_total: string;
  ganancia: string;
  descuento: string;
  recargo?: string;
  unidad_medida: string;
}

interface Venta {
  idventa: number;
  nombre_cliente: string;
  documento_cliente: string;
  tipo: string;
  total: string;
  fecha: string;
  tipo_descuento: string;
  total_descuento: string;
  total_recargo?: string;
  tipo_recargo?: string | null;
  total_ganancia: string;
  detalles: DetalleVenta[];
}

interface ModalDetalleVentaProps {
  venta: Venta | null;
  isOpen: boolean;
  onClose: () => void;
  ventana?: boolean;
}

const ModalDetalleVenta: React.FC<ModalDetalleVentaProps> = ({ venta, isOpen, onClose, ventana = false }) => {
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (venta) {
      console.log("Detalles de venta", venta)
    }
  }, [venta])

  if (!isOpen || !venta) return null;

  const tieneDescuento = Number(venta.total_descuento) > 0;
  const tieneRecargo = Number(venta.total_recargo) > 0;
  const tipoDescuentoTexto =
    venta.tipo_descuento === "descuento_total" ? "Descuento Total" :
      venta.tipo_descuento === "descuento_producto" ? "Descuento Producto" :
        "Sin Descuento";


  const handleReimprimir = async (idventa: number) => {
    try {
      const res = await comprobanteVenta(idventa);

      if (res.data?.facturaPDFBase64) {
        console.log("Factura generada:", res.data.facturaPDFBase64);
        const base64 = res.data.facturaPDFBase64;
        const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('  Error al generar comprobante:', error);
      setErrorMessage('Error al generar el comprobante');
    }
  };

  return (
    <div className={ventana ? "min-h-screen bg-slate-50 p-4 dark:bg-slate-950" : "fixed inset-0 z-50 flex items-center justify-center p-4"}>
      <div className="
          bg-white dark:bg-slate-900
          rounded-2xl shadow-2xl
          max-w-5xl w-full mx-auto max-h-[90vh]
          overflow-hidden flex flex-col
        ">
        {/* Header */}
        <div className="
            bg-gradient-to-r from-blue-600 to-indigo-700
            dark:from-slate-800 dark:to-slate-700
            px-6 py-4 flex justify-between items-center
          ">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 dark:bg-slate-600 p-2 rounded-lg">
              <ShoppingBagIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Detalle de Venta</h2>
              <p className="text-blue-100 text-sm">{venta.nombre_cliente}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleReimprimir(venta.idventa)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition"
            >
              <PrinterIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Re-imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 dark:bg-slate-900">
          {/* Info Cards con CardText */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <CardText
              title="Cliente"
              text={`${venta.nombre_cliente} - ${venta.documento_cliente}`}

            />
            <CardText
              title="Fecha"
              text={new Date(venta.fecha).toLocaleDateString('es-PY')}

            />
            <CardText
              title="Ganancia"
              text={formatPY(venta.total_ganancia)}
            />
            {tieneRecargo && (
              <CardText
                title={venta.tipo_recargo === "recargo_total" ? "Recargo Total" : "Recargo Productos"}
                text={formatPY(venta.total_recargo)}
              />
            )}
            {tieneDescuento && (
              <CardText
                title={tipoDescuentoTexto}
                text={formatPY(venta.total_descuento)}

              />
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium">
              {venta.tipo === 'contado' ? 'Contado' : 'Crédito'}
            </span>
          </div>

          {/* Tabla de productos */}
          <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4 border border-blue-200 dark:border-slate-700">
            <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-4 flex items-center gap-2">
              <ShoppingBagIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Productos ({venta.detalles.length})
            </h3>
            {/* Vista Móvil con CardText */}
            <div className="space-y-3">
              {venta.detalles.map((d) => (
                <div key={d.iddetalle} className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-blue-200 dark:border-slate-600">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 ">{d.nombre_producto}</h4>
                  {d.atributos_texto && <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">{String(d.atributos_texto).replace(/ x(\d+)/g, " ×$1")}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <CardText
                      title="Cantidad"
                      text={`${parseFloat(d.cantidad).toFixed(2)} ${d.unidad_medida}`}
                      containerClass="bg-blue-50 dark:bg-slate-800 rounded-lg p-2 border border-blue-100 dark:border-slate-600"
                      titleClass="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1"
                      textClass="text-xs font-bold text-blue-700 dark:text-gray-200"
                    />
                    <CardText
                      title="Precio"
                      text={formatPY(d.precio_venta)}
                      containerClass="bg-blue-50 dark:bg-slate-800 rounded-lg p-2 border border-blue-100 dark:border-slate-600"
                      titleClass="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1"
                      textClass="text-xs font-bold text-blue-700 dark:text-gray-200"
                    />
                    <CardText
                      title="Ganancia"
                      text={formatPY(d.ganancia)}
                      containerClass="bg-blue-50 dark:bg-slate-800 rounded-lg p-2 border border-blue-100 dark:border-slate-600"
                      titleClass="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1"
                      textClass="text-xs font-bold text-blue-700 dark:text-gray-200"
                    />
                    <CardText
                      title="Descuento"
                      text={formatPY(d.descuento)}
                      containerClass="bg-blue-50 dark:bg-slate-800 rounded-lg p-2 border border-blue-100 dark:border-slate-600"
                      titleClass="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1"
                      textClass="text-xs font-bold text-blue-700 dark:text-gray-200"
                    />
                    {Number(d.recargo) > 0 && <CardText
                      title="Recargo"
                      text={formatPY(d.recargo)}
                      containerClass="bg-blue-50 dark:bg-slate-800 rounded-lg p-2 border border-blue-100 dark:border-slate-600"
                      titleClass="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1"
                      textClass="text-xs font-bold text-blue-700 dark:text-gray-200"
                    />}
                    <CardText
                      title="Subtotal"
                      text={formatPY(d.sub_total)}
                      containerClass="bg-blue-50 dark:bg-slate-800 rounded-lg p-2 border border-blue-100 dark:border-slate-600 col-span-2"
                      titleClass="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1"
                      textClass="text-xs font-bold text-blue-700 dark:text-gray-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer con total */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 px-6 py-4 border-t border-blue-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-blue-600 dark:text-blue-400">
              {venta.detalles.length} producto{venta.detalles.length !== 1 ? 's' : ''} en total
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total de la venta</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatPY(venta.total)}
              </p>
              {tieneDescuento && <p className="text-xs text-blue-600 dark:text-blue-400">Descuento aplicado: {formatPY(venta.total_descuento)}</p>}
              {tieneRecargo && <p className="text-xs text-blue-600 dark:text-blue-400">Recargo aplicado: {formatPY(venta.total_recargo)}</p>}
            </div>
          </div>
        </div>
      </div>
      <ModalError isOpen={!!errorMessage} onClose={() => setErrorMessage("")} message={errorMessage} />
    </div>
  );
};

export default ModalDetalleVenta;
