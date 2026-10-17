'use client';

import React, { useState, useEffect } from 'react';
import { Package, Check } from 'lucide-react';
import { getDetalles, type DetalleProductoResponse } from '../../../services/productoDetalle';

interface AtributosProductosProps {
  idproducto: number;
  nombreProducto: string;
  detalleSeleccionado: DetalleProductoResponse | null;
  onSelectDetalle: (detalle: DetalleProductoResponse | null) => void;
}

const AtributosProductos: React.FC<AtributosProductosProps> = ({
  idproducto,
  nombreProducto: _nombreProducto,
  detalleSeleccionado,
  onSelectDetalle,
}) => {
  const [detalles, setDetalles] = useState<DetalleProductoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetalles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getDetalles(idproducto);
        setDetalles(response.detalles || []);
      } catch (err: any) {
        console.error('Error al obtener detalles del producto:', err);
        setError('No se pudieron cargar los atributos del producto');
        setDetalles([]);
      } finally {
        setLoading(false);
      }
    };

    if (idproducto) {
      fetchDetalles();
    }
  }, [idproducto]);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
        <div className="flex items-center gap-2 text-blue-700">
          <Package size={14} className="animate-pulse" />
          <span className="text-xs">Cargando atributos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-2">
        <p className="text-xs text-red-700">{error}</p>
      </div>
    );
  }

  if (detalles.length === 0) {
    return null; // No mostrar nada si no hay detalles
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Package className="text-purple-600" size={14} />
          <span className="text-xs font-semibold text-purple-900">Atributos</span>
        </div>
        {detalleSeleccionado && (
          <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <Check size={10} />
            {detalleSeleccionado.atributo}: {detalleSeleccionado.valor}
          </span>
        )}
      </div>

      {/* Grid compacto de opciones */}
      <div className="grid grid-cols-2 gap-2">
        {/* Opción "Sin atributo específico" */}
        <button
          type="button"
          onClick={() => onSelectDetalle(null)}
          className={`text-left border rounded-md p-2 transition-all ${
            detalleSeleccionado === null
              ? 'border-purple-500 bg-purple-100 shadow-sm'
              : 'border-gray-300 bg-white hover:border-purple-300'
          }`}
        >
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">Sin atributo</p>
              <p className="text-[10px] text-gray-600 truncate">General</p>
            </div>
            {detalleSeleccionado === null && (
              <Check size={12} className="text-purple-600 flex-shrink-0 mt-0.5" />
            )}
          </div>
        </button>

        {/* Lista de detalles en grid */}
        {detalles.map((detalle) => (
          <button
            type="button"
            key={detalle.iddetalle}
            onClick={() => onSelectDetalle(detalle)}
            className={`text-left border rounded-md p-2 transition-all ${
              detalleSeleccionado?.iddetalle === detalle.iddetalle
                ? 'border-purple-500 bg-purple-100 shadow-sm'
                : 'border-gray-300 bg-white hover:border-purple-300'
            }`}
          >
            <div className="flex items-start justify-between gap-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] font-semibold text-purple-600 uppercase truncate">
                    {detalle.atributo}:
                  </span>
                  <span className="text-xs font-medium text-gray-800 truncate">
                    {detalle.valor}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-600">Stock:</span>
                  <span className="text-[10px] font-semibold text-green-700">
                    {detalle.cantidad}
                  </span>
                </div>
              </div>
              {detalleSeleccionado?.iddetalle === detalle.iddetalle && (
                <Check size={12} className="text-purple-600 flex-shrink-0 mt-0.5" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AtributosProductos;
