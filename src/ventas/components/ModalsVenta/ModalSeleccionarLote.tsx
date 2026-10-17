'use client';

import React, { useState, useMemo } from 'react';
import { XCircle, PackageCheck, Plus, AlertCircle } from 'lucide-react';
import { calcularStockDisponibleLote } from '../../utils/stockCalculations';

interface Lote {
  idlote: number;
  numero_lote: string;
  cantidad_inicial: number;
  stock_actual: number;
  fecha_vencimiento: string;
  fecha_ingreso: string;
  precio_compra: string;
  precio_compra_caja?: string | number;
  ubicacion_almacen: string;
  estado: string;
  dias_hasta_vencimiento: number;
  nombre_producto: string;
  unidad_medida: string;
  precio_venta?: string;
  precio_venta_caja?: string | number;
  cant_p_caja?: number;
  precio_venta_pack?: string | number;
  cant_p_pack?: number;
  idproducto?: number;
  iva?: number;
  referencia_proveedor?: string;
}

interface ModalSeleccionarLoteProps {
  isOpen: boolean;
  setCantidadMaximo?: (cantidad: number) => void;
  onClose: () => void;
  lotes: Lote[];
  onSelect: (lote: Lote) => void;
  detalles?: any[]; // Detalles de venta actuales para calcular stock disponible
  productoInfo?: {
    idproducto: number;
    nombre_producto: string;
    precio_venta: number;
    precio_compra: number;
    unidad_medida: string;
    iva: number;
    precio_venta_caja?: number;
    cant_p_caja?: number;
    precio_venta_pack?: number;
    cant_p_pack?: number;
  };
}

const ModalSeleccionarLote: React.FC<ModalSeleccionarLoteProps> = ({
  isOpen,
  setCantidadMaximo,
  onClose,
  lotes,
  onSelect,
  detalles = [],
  productoInfo,
}) => {
  const [mostrarFormNuevoLote, setMostrarFormNuevoLote] = useState(false);
  const [nuevoNumeroLote, setNuevoNumeroLote] = useState('');

  //   IMPORTANTE: Calcular stock disponible ANTES del return condicional
  // Los hooks deben ejecutarse en el mismo orden en cada render
  const lotesConStockDisponible = useMemo(() => {
    return lotes.map((lote) => {
      const stockDisponible = calcularStockDisponibleLote(
        {
          idlote: lote.idlote,
          idproducto: lote.idproducto || 0,
          stock_actual: lote.stock_actual,
          unidad_medida: lote.unidad_medida,
        },
        detalles
      );

      return { ...lote, stockDisponible };
    });
  }, [lotes, detalles]);

  // Return condicional DESPUÉS de todos los hooks
  if (!isOpen) return null;
  console.log('Lotes disponible en tabla', lotes);

  const handleCrearNuevoLote = () => {
    if (!nuevoNumeroLote.trim()) {
      alert('Por favor ingrese un número de lote');
      return;
    }

    if (!productoInfo) {
      alert('No se pudo obtener la información del producto');
      return;
    }

    // Crear un objeto lote temporal con la información del producto
    const nuevoLote: Lote = {
      idlote: -1, // ID temporal negativo para indicar que es nuevo
      numero_lote: nuevoNumeroLote,
      cantidad_inicial: 0,
      stock_actual: 999999, // Stock ilimitado para nuevo lote
      fecha_vencimiento: '',
      fecha_ingreso: new Date().toISOString(),
      precio_compra: productoInfo.precio_compra.toString(),
      ubicacion_almacen: 'PRINCIPAL',
      estado: 'disponible',
      dias_hasta_vencimiento: 999,
      nombre_producto: productoInfo.nombre_producto,
      unidad_medida: productoInfo.unidad_medida,
      precio_venta: productoInfo.precio_venta.toString(),
      precio_venta_caja: productoInfo.precio_venta_caja,
      cant_p_caja: productoInfo.cant_p_caja,
      idproducto: productoInfo.idproducto,
      iva: productoInfo.iva,
    };

    onSelect(nuevoLote);
    setNuevoNumeroLote('');
    setMostrarFormNuevoLote(false);
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-opacity-50 z-[80] flex items-center justify-center">
      <div className="bg-white w-full max-w-3xl rounded-xl p-6 shadow-xl animate-fade-in border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <PackageCheck className="text-blue-600" size={24} />
            Seleccionar lote del producto
          </h2>
          {/* type="button" en todos los botones de este modal: se monta dentro del
              <form> de Nueva Compra. Sin type, el default es "submit" y cualquier
              click disparaba el registro de la compra. */}
          <button type="button" onClick={onClose} className="text-red-500 hover:text-red-600">
            <XCircle size={28} />
          </button>
        </div>

        {/* Botón para crear nuevo lote */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setMostrarFormNuevoLote(!mostrarFormNuevoLote)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition flex items-center gap-2"
          >
            <Plus size={18} />
            {mostrarFormNuevoLote ? 'Cancelar nuevo lote' : 'Crear nuevo lote'}
          </button>
        </div>

        {/* Formulario para crear nuevo lote */}
        {mostrarFormNuevoLote && (
          <div className="mb-4 p-4 border-2 border-green-500 rounded-lg bg-green-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Nuevo Lote</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Lote
                </label>
                <input
                  type="text"
                  value={nuevoNumeroLote}
                  onChange={(e) => setNuevoNumeroLote(e.target.value)}
                  placeholder="Ej: LOTE-2024-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCrearNuevoLote();
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleCrearNuevoLote}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition"
              >
                Crear y Seleccionar
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Se creará un nuevo lote con este número para el producto seleccionado
            </p>
          </div>
        )}

        {/* Cards de lotes existentes */}
        {lotesConStockDisponible.length === 0 ? (
          <div className="text-center py-10">
            <PackageCheck className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-600">No hay lotes disponibles con stock.</p>
          </div>
        ) : (
          <div className="grid gap-3 max-h-[450px] overflow-y-auto pr-2">
            {lotesConStockDisponible.map((lote) => {
              const diasVencimiento = lote.dias_hasta_vencimiento;
              const esCercaVencer = diasVencimiento <= 30 && diasVencimiento > 0;
              const estaVencido = diasVencimiento <= 0;

              const sinStock = lote.stockDisponible <= 0;

              return (
                <div
                  key={lote.idlote}
                  className={`border rounded-lg p-4 transition-all ${
                    sinStock ? 'opacity-60' : 'hover:shadow-md'
                  } ${
                    lote.unidad_medida === 'CAJA'
                      ? 'bg-orange-50 border-orange-200 hover:border-orange-300'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {/* Alerta de sin stock */}
                  {sinStock && (
                    <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      <AlertCircle className="text-red-600" size={16} />
                      <span className="text-xs font-medium text-red-700">
                        Stock agotado en el carrito
                      </span>
                    </div>
                  )}
                  {/* Header del Card */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-lg">
                          Lote: {lote.numero_lote}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          lote.unidad_medida === 'CAJA'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {lote.unidad_medida || 'UNIDAD'}
                        </span>
                      </div>

                      {/* Stock y Vencimiento */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {/* Mostrar stock disponible si es diferente del stock actual */}
                        {lote.stockDisponible !== lote.stock_actual ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">Disponible:</span>
                              <span className={`font-bold ${
                                lote.stockDisponible <= 0 ? 'text-red-600' :
                                lote.stockDisponible <= 10 ? 'text-orange-600' :
                                'text-green-600'
                              }`}>
                                {lote.stockDisponible}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Total:</span>
                              <span className="text-xs font-medium text-gray-600">{lote.stock_actual}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600">Stock:</span>
                            <span className="font-semibold text-blue-700">{lote.stock_actual}</span>
                          </div>
                        )}
                        {lote.fecha_vencimiento && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600">Vence:</span>
                            <span className={`font-medium ${
                              estaVencido ? 'text-red-600' : esCercaVencer ? 'text-orange-600' : 'text-gray-800'
                            }`}>
                              {new Date(lote.fecha_vencimiento).toLocaleDateString()}
                              {estaVencido && ' (Vencido)'}
                              {esCercaVencer && ` (${diasVencimiento}d)`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botón Seleccionar con validación de stock */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(lote);
                        // Usar stock disponible en lugar de stock_actual
                        setCantidadMaximo && setCantidadMaximo(lote.stockDisponible);
                        onClose();
                      }}
                      disabled={lote.stockDisponible <= 0}
                      className={`px-4 py-2 rounded-md transition-colors font-medium text-sm ${
                        lote.stockDisponible <= 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                      title={lote.stockDisponible <= 0 ? 'Sin stock disponible' : 'Seleccionar lote'}
                    >
                      {lote.stockDisponible <= 0 ? 'Sin Stock' : 'Seleccionar'}
                    </button>
                  </div>

                  {/* Grid de Precios */}
                  <div className={`grid gap-3 pt-3 border-t border-gray-200 ${
                    lote.unidad_medida === 'CAJA' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'
                  }`}>
                    {/* Precio Compra Unitario */}
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        {lote.unidad_medida === 'CAJA' ? 'P. Compra Unit.' : 'Precio Compra'}
                      </p>
                      <p className="font-semibold text-blue-700">
                        ₲ {parseInt(lote.precio_compra).toLocaleString('es-PY')}
                      </p>
                    </div>

                    {/* Precio Compra Caja - Solo para productos CAJA */}
                    {lote.unidad_medida === 'CAJA' && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">P. Compra Caja</p>
                        <p className="font-semibold text-blue-600">
                          {lote.precio_compra_caja ? (
                            `₲ ${parseInt(String(lote.precio_compra_caja)).toLocaleString('es-PY')}`
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Precio Venta Unitario */}
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        {lote.unidad_medida === 'CAJA' ? 'P. Venta Unit.' : 'Precio Venta'}
                      </p>
                      <p className="font-semibold text-green-700">
                        ₲ {parseInt(lote.precio_venta || '0').toLocaleString('es-PY')}
                      </p>
                    </div>

                    {/* Precio Venta Caja - Solo para productos CAJA */}
                    {lote.unidad_medida === 'CAJA' && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">P. Venta Caja</p>
                        <p className="font-semibold text-green-600">
                          {lote.precio_venta_caja ? (
                            `₲ ${parseInt(String(lote.precio_venta_caja)).toLocaleString('es-PY')}`
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-right">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-md transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSeleccionarLote;
