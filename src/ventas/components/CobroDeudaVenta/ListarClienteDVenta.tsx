'use client';

import { useCallback, useEffect, useState } from 'react';
import ModalCobroDeuda from '../ModalsVenta/ModalCobroDeuda';
import { CurrencyDollarIcon, EyeIcon, BanknotesIcon } from '@heroicons/react/24/solid';
import ModalComprobantePago from '../ModalsVenta/ModalComprobantePago';
import ModalListarDetallesPagosDeuda from '../ModalsVenta/ModalListarDetallesPagosDeuda';
import { type ComprobantePago } from '../interface';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SelectState from './components/SelectState';
import { listarDeudasVenta, } from '../../../services/ventas';
import { formatPY } from '../../../movimiento/utils/utils';

interface ListarClienteDVentaProps {
  nombreCliente?: string;
  disableSearch?: boolean;
  setEstadoCliente?: (estado: string) => void;
  generateReport?: () => void;
}
const optionsState = [
  { id: "", name: 'Todos' },
  { id: "Pendiente", name: 'Pendientes' },
  { id: "Pagado", name: 'Pagados' },
]
const ListarClienteDVenta = ({ nombreCliente, disableSearch, setEstadoCliente, generateReport }: ListarClienteDVentaProps) => {
  const [comprobante, setComprobante] = useState<ComprobantePago>();
  const [showComprobante, setShowComprobante] = useState(false);
  const [deudas, setDeudas] = useState<any[]>([]);
  const [selected, setSelected] = useState(optionsState[1])
  const [montoMaximo, setMontoMaximo] = useState(0);
  const [idDeudaDetalle, setIdDeudaDetalle] = useState(0);
  const [showModalDetailPay, setShowModalDetailPay] = useState(false);
  const [showModalCobroDeuda, setShowModalCobroDeuda] = useState(false);
  const [iddeudaSeleccionada, setIddeudaSeleccionada] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (nombreCliente) {
      setSearch(nombreCliente);
      setPage(1);
    }
  }, [nombreCliente]);

  const fetchDeudas = useCallback(async () => {
    try {
      const res = await listarDeudasVenta({
        page,
        limit,
        search,
        estado: selected.id
      });
      setDeudas(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Error al obtener deudas:', err);
    }
  }, [page, limit, search, selected]);

  useEffect(() => {
    fetchDeudas();
  }, [fetchDeudas]);
  
  const handleCobrar = (deuda: any) => {
    setIddeudaSeleccionada(deuda.iddeuda);
    setMontoMaximo(deuda.total_deuda - deuda.total_pagado);
    setShowModalCobroDeuda(true);
  };

  const showPayDetails = (idDeudaDetalle: number) => {
    setIdDeudaDetalle(idDeudaDetalle);
    setShowModalDetailPay(true);
  };

  useEffect(() => {
    if (selected && setEstadoCliente) {
      setEstadoCliente(selected.id ?? "");
    }
  }, [selected]);

  const inputStyle = `w-full sm:w-[400px] px-10 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-green-500 ${disableSearch ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300'}`

  const styleButton = "bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md shadow transition"
  return (
    <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl p-8 mt-10 border border-gray-200">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-800">Deudas por Venta</h1>
        </div>
        <select
          className="text-sm px-4 py-2 border border-gray-300 rounded-md"
          value={limit}
          onChange={(e) => {
            setLimit(parseInt(e.target.value));
            setPage(1);
          }}
        >
          <option value={5}>5 por página</option>
          <option value={10}>10 por página</option>
          <option value={20}>20 por página</option>
        </select>
      </div>
      <div className="relative mb-6 flex flex-row gap-4">
        <div>
          <input
            type="text"
            placeholder="Buscar por cliente o estado..."

            value={search}
            disabled={disableSearch}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={inputStyle}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <SelectState
          value={selected}
          onChange={setSelected}
          options={optionsState}
        />
        <button className={styleButton} onClick={() => { generateReport && generateReport() }}>Generar reporte por cliente</button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-green-100 text-green-800 text-xs font-semibold">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Documento N°</th>
              <th className="px-4 py-3 text-left">Total Deuda</th>
              <th className="px-4 py-3 text-left">Total Pagado</th>
              <th className="px-4 py-3 text-left">Saldo</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Ult. Fecha Pago</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {deudas.map((deuda, idx) => (
              <tr key={deuda.iddeuda} className="hover:bg-gray-50 transition">
                <td className="px-4 py-2">{(page - 1) * limit + idx + 1}</td>
                <td className="px-4 py-2 font-medium">{deuda.nombre_cliente}</td>
                <td className="px-4 py-2">{deuda.numDocumento}</td>
                <td className="px-4 py-2">{formatPY(deuda.total_deuda)}</td>
                <td className="px-4 py-2 text-green-700">{formatPY(deuda.total_pagado)}</td>
                <td className="px-4 py-2 font-semibold text-red-600">{formatPY(deuda.saldo)}</td>
                <td className="px-4 py-2">{deuda.estado}</td>
                <td className="px-4 py-2">{new Date(deuda.fecha_deuda).toLocaleDateString()}</td>
                <td className="px-4 py-2">{deuda.ult_fecha_pago ? new Date(deuda.ult_fecha_pago).toLocaleDateString("es-PY") : "--"}</td>
                <td className="px-4 py-2 text-center space-x-2">
                  <button
                    onClick={() => handleCobrar(deuda)}
                    className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  >
                    <BanknotesIcon className="h-4 w-4" />
                    Cobrar
                  </button>
                  <button
                    onClick={() => showPayDetails(deuda.iddeuda)}
                    className="inline-flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Ver Pagos
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded disabled:opacity-50"
        >
          ⬅ Anterior
        </button>
        <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={page >= totalPages}
          className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded disabled:opacity-50"
        >
          Siguiente ➡
        </button>
      </div>

      {/* Modales */}
      {showModalCobroDeuda && iddeudaSeleccionada && (
        <ModalCobroDeuda
          montoMaximo={montoMaximo}
          isOpen={showModalCobroDeuda}
          setComprobante={setComprobante}
          setShowComprobante={setShowComprobante}
          onClose={() => setShowModalCobroDeuda(false)}
          idDeuda={iddeudaSeleccionada}
          onSuccess={() => {
            fetchDeudas();
            setShowModalCobroDeuda(false);
          }}
        />
      )}
      {showComprobante && comprobante && (
        <ModalComprobantePago
          onClose={() => setShowComprobante(false)}
          comprobante={comprobante}
        />
      )}
      <ModalListarDetallesPagosDeuda
        iddeuda={idDeudaDetalle}
        isOpen={showModalDetailPay}
        onClose={() => setShowModalDetailPay(false)}
        onSuccess={() => {
          fetchDeudas();
        }}
      />
    </div>
  );
};

export default ListarClienteDVenta;
