'use client';

import React from 'react';
import { XMarkIcon, CubeIcon } from '@heroicons/react/24/outline';
import CardText from '../../../ventas/components/CobroDeudaVenta/components/CardText';

interface Detalle {
  iddetalle: number;
  nombre_producto: string;
  atributos_texto?: string | null;
  cantidad: string;
  precio: string;
  sub_total: string;
  unidad_medida: string;
  iva?: string;
  stock_restante?: string;
}

interface Compra {
  idcompra: number;
  nombre: string;
  nro_factura: string;
  tipo: string;
  total: string;
  fecha: string;
  estado: string;
  observacion?: string;
  cajero_nombre?: string;
  descuento?: string;
  detalles: Detalle[];
}

interface ModalDetalleCompraProps {
  compra: Compra | null;
  isOpen: boolean;
  onClose: () => void;
  ventana?: boolean;
}

const ModalDetalleCompra: React.FC<ModalDetalleCompraProps> = ({ compra, isOpen, onClose, ventana = false }) => {
  if (!isOpen || !compra) return null;

  const esInventarioInicial = compra.observacion?.toLowerCase() === 'inventario inicial';
  const esCompraVacia = parseFloat(compra.total || '0') === 0;


  return (
    <div className={ventana ? 'min-h-screen bg-slate-50 p-4 dark:bg-gray-900' : 'fixed inset-0 z-50 flex items-center justify-center p-4'}>
      <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ${ventana ? 'mx-auto min-h-[80vh] max-w-5xl w-full' : 'max-w-4xl w-full max-h-[90vh]'} overflow-hidden flex flex-col`}>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-slate-800 dark:to-slate-700 px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <CubeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Detalle de Compra</h2>
              {esInventarioInicial && (
                <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-medium">
                  Inventario Inicial
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 dark:hover:bg-white/10 p-2 rounded-lg transition"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info Cards con CardText */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <CardText
              title="Proveedor"
              text={compra.nombre}
            />
            <CardText
              title="Factura"
              text={compra.nro_factura}
            />
            <CardText
              title="Fecha"
              text={new Date(compra.fecha).toLocaleDateString('es-PY')}
            />
            <CardText
              title="Cajero"
              text={compra.cajero_nombre || 'N/A'}
            />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="bg-blue-100 text-blue-800 dark:bg-slate-700 dark:text-slate-200 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium">
              {compra.tipo === 'contado' ? 'Contado' : 'Crédito'}
            </span>
            <span className="bg-blue-100 text-blue-800 dark:bg-slate-700 dark:text-slate-200 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium">
              {compra.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
            </span>
            {esCompraVacia && (
              <span className="bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium">
                Sin movimiento
              </span>
            )}
          </div>

          {/* Observación */}
          {compra.observacion && (
            <div className={`mb-6 p-4 rounded-xl ${esInventarioInicial
              ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700'
              : 'bg-blue-50 border border-blue-200 dark:bg-slate-800 dark:border-slate-700'
              }`}>
              <p className="text-sm">
                <span className="font-semibold text-blue-700 dark:text-slate-200">Observación:</span>{' '}
                <span className="text-blue-600 dark:text-slate-400">{compra.observacion}</span>
              </p>
            </div>
          )}

          {/* Tabla de productos */}
          <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4 border border-blue-200 dark:border-slate-700">
            <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <CubeIcon className="h-5 w-5 text-blue-600" />
              Productos ({compra.detalles.length})
            </h3>

            {/* Vista Móvil con CardText */}
            <div className="space-y-4">
              {compra.detalles.map((d) => (
                <div key={d.iddetalle} className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-blue-200 dark:border-slate-700">
                  <h4 className="font-semibold text-blue-800 ">{d.nombre_producto}</h4>
                  {d.atributos_texto && <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">{String(d.atributos_texto).replace(/ x(\d+)/g, " ×$1")}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <CardText
                      title="Cantidad"
                      text={`${parseFloat(d.cantidad).toFixed(2)} ${d.unidad_medida}`}

                    />
                    <CardText
                      title="Precio"
                      text={`${parseInt(d.precio).toLocaleString("es-PY")} Gs`}

                    />
                    <CardText
                      title="IVA"
                      text={`${d.iva || '0'}%`}

                    />
                    <CardText
                      title="Subtotal"
                      text={`${parseInt(d.sub_total).toLocaleString("es-PY")} Gs`}

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
            <div className="text-sm text-blue-600">
              {compra.detalles.length} producto{compra.detalles.length !== 1 ? 's' : ''} en total
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600 mb-1">Total de la compra</p>
              <p className={`text-2xl font-bold ${esCompraVacia
                  ? 'text-gray-400 dark:text-slate-500'
                  : 'text-blue-700 dark:text-slate-100'
                }`}>
                {parseInt(compra.total).toLocaleString("es-PY")} Gs
              </p>
              {parseFloat(compra.descuento || '0') > 0 && (
                <p className="text-xs text-blue-600">Descuento: {parseInt(compra.descuento || '0').toLocaleString("es-PY")} Gs</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleCompra;
