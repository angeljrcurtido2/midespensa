'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaMoneyBill,
  FaCalendar,
  FaFileAlt,
  FaFilter,
  FaInfoCircle,
  FaExclamationTriangle,
  FaFilePdf,
} from 'react-icons/fa';
import { listarDeudasPorClienteId, listarDeudasVentaCompletoPorCliente } from '../../../services/ventas';
import { formatPY } from '../../../movimiento/utils/utils';
import CardText from './components/CardText';
import SelectPage from '../../../components/SelectPage';
import ButtonGrid from '../../../components/ButtonGrid';
import SelectPagination from '../../../components/SelectPagination';
import { descargarPdfBase64, fechaParaNombreArchivo } from '../../../utils/descargarPdf';

interface DetallesCreditosClienteProps {
  idcliente: number;
  nombreCompleto: string;
  numDocumento: string;
}

interface DeudaData {
  iddeuda: number;
  idventa: number;
  total_deuda: number;
  total_pagado: number;
  saldo: number;
  estado: string;
  fecha_deuda: string;
  ult_fecha_pago: string | null;
  tiene_cuotas: string;
  total_cuotas: number;
  cuotas_pendientes: number;
  proxima_fecha_vencimiento: string | null;
  monto_proxima_cuota: number | null;
  fecha_venta: string;
}

const DetallesCreditosCliente: React.FC<DetallesCreditosClienteProps> = ({
  idcliente,
  nombreCompleto,
  numDocumento,
}) => {
  const navigate = useNavigate();
  const [deudas, setDeudas] = useState<DeudaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [estado, setEstado] = useState('');
  const [vistaGrid, setVistaGrid] = useState(true);

  // Modal states

  const fetchDeudas = async () => {
    try {
      setLoading(true);
      const response = await listarDeudasPorClienteId(idcliente, {
        page,
        limit,
        estado,
      });

      if (response.data) {
        setDeudas(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error al listar deudas del cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeudas();
  }, [page, limit, estado, idcliente]);

  const handleCobrar = (deuda: DeudaData) => {
    sessionStorage.setItem('deuda-venta-actual', JSON.stringify({ id: deuda.iddeuda, montoMaximo: deuda.saldo }));
    navigate(`/ventas/cobrodeuda/pagar/${deuda.iddeuda}`);
  };

  const handleVerPagos = (iddeuda: number) => {
    navigate(`/ventas/cobrodeuda/pagos/${iddeuda}`);
  };

  const handleGenerarReporte = async () => {
    try {
      const response = await listarDeudasVentaCompletoPorCliente({
        numDocumento: numDocumento,
        estado: estado,
      });

      if (response.data.reportePDFBase64) {
        descargarPdfBase64(
          response.data.reportePDFBase64,
          `Deudas_Cliente_${numDocumento}_${fechaParaNombreArchivo()}.pdf`
        );
      }
    } catch (error) {
      console.error('Error al generar el reporte:', error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pendiente: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Pendiente' },
      pagado: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Pagado' },
      vencido: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Vencido' },
    };
    const badge = badges[estado] || badges.pendiente;
    return (
      <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-semibold`}>
        {badge.label}
      </span>
    );
  };


  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-gray-800 rounded-xl p-6 mb-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{nombreCompleto}</h2>
            <p className="text-blue-100">Documento: {numDocumento}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerarReporte}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
            >
              <FaFilePdf className="text-lg" />
              Generar Reporte
            </button>
            <div className="bg-white/20 p-4 rounded-xl">
              <FaFileAlt className="text-4xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-500 dark:text-gray-400" />
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="
              px-3 py-2 rounded-lg text-sm
              bg-white border border-gray-300
              dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200
            "
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="pagado">Pagados</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
          <ButtonGrid onClick={(isGrid) => setVistaGrid(isGrid)} vistaGrid={vistaGrid} />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Lista de créditos */}
      {!loading && deudas.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FaInfoCircle className="text-gray-400 text-5xl mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No se encontraron créditos para este cliente</p>
        </div>
      )}

      {!loading && deudas.length > 0 && (
        <div className={vistaGrid ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'grid grid-cols-1 gap-4'}>
          {deudas.map((deuda) => (
            <div
              key={deuda.iddeuda}
              className="
              bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              rounded-xl p-5
            "
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Crédito</h3>
                    {getEstadoBadge(deuda.estado)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaCalendar className="text-gray-400" />
                    <span>Venta: {formatDate(deuda.fecha_venta)}</span>
                    <span className="text-gray-400">•</span>
                    <span>Deuda: {formatDate(deuda.fecha_deuda)}</span>
                  </div>
                </div>
              </div>

              {/* Información financiera */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { title: "Total Deuda", text: formatPY(deuda.total_deuda) },
                  { title: "Pagado", text: formatPY(deuda.total_pagado) },
                  { title: "Saldo", text: formatPY(deuda.saldo) }
                ].map((card, index) => (
                  <CardText
                    key={index}
                    title={card.title}
                    text={card.text}
                  />
                ))}
              </div>

              {/* Información de cuotas */}
              {deuda.tiene_cuotas === 'true' && deuda.total_cuotas > 0 && (
                <div className="
                    bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4
                    dark:bg-gray-800 dark:border-gray-700
                  ">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-blue-700 dark:text-gray-200">
                      Plan de Cuotas
                    </p>
                    <span className="
                        text-xs px-2 py-1 rounded
                        bg-blue-100 text-blue-700
                        dark:bg-gray-700 dark:text-gray-200
                      ">
                      {deuda.total_cuotas} cuotas
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-600 dark:text-gray-400">
                        Pendientes:
                      </span>
                      <span className="font-bold text-blue-700 dark:text-gray-200 ml-2">
                        {deuda.cuotas_pendientes}
                      </span>
                    </div>

                    <div>
                      <span className="text-blue-600 dark:text-gray-400">
                        Pagadas:
                      </span>
                      <span className="font-bold text-blue-700 dark:text-gray-200 ml-2">
                        {deuda.total_cuotas - deuda.cuotas_pendientes}
                      </span>
                    </div>
                  </div>

                  {deuda.cuotas_pendientes > 0 && deuda.proxima_fecha_vencimiento && (
                    <div className="
                        mt-3 pt-3 border-t border-blue-200
                        dark:border-gray-700
                      ">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-blue-600 dark:text-gray-400 mb-1">
                            Próxima cuota
                          </p>
                          <p className="font-bold text-blue-700 dark:text-gray-200">
                            {formatPY(deuda.monto_proxima_cuota || 0)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-blue-600 dark:text-gray-400 mb-1">
                            Vencimiento
                          </p>
                          <p className="font-semibold text-blue-700 dark:text-gray-200 flex items-center gap-1">
                            <FaCalendar className="text-xs" />
                            {formatDate(deuda.proxima_fecha_vencimiento)}
                          </p>
                        </div>
                      </div>

                      {/* Advertencia si está vencida */}
                      {new Date(deuda.proxima_fecha_vencimiento) < new Date() && (() => {
                        const fechaVencimiento = new Date(deuda.proxima_fecha_vencimiento);
                        const fechaActual = new Date();
                        const diferenciaMilisegundos =
                          fechaActual.getTime() - fechaVencimiento.getTime();
                        const diasVencidos = Math.floor(
                          diferenciaMilisegundos / (1000 * 60 * 60 * 24)
                        );

                        return (
                          <div className="
                              mt-2 rounded-lg p-2 flex items-center gap-2
                              bg-gray-200 border border-gray-300
                              dark:bg-gray-700 dark:border-gray-600
                            ">
                            <FaExclamationTriangle className="text-gray-600 dark:text-gray-300" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                              Cuota vencida hace {diasVencidos}{' '}
                              {diasVencidos === 1 ? 'día' : 'días'}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

              )}

              {/* Última fecha de pago */}
              {deuda.ult_fecha_pago && (
                <div className="mb-4 text-sm text-gray-600">
                  <span className="font-medium">Último pago:</span> {formatDate(deuda.ult_fecha_pago)}
                </div>
              )}

              {/* Botones de acción */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCobrar(deuda)}
                  disabled={deuda.estado === 'pagado'}
                  className={`
                              flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                              ${deuda.estado === 'pagado'
                                              ? `
                                  bg-blue-200 text-gray-500 cursor-not-allowed
                                  dark:bg-gray-700 dark:text-gray-400
                                `
                                              : `
                                  bg-blue-500 text-white shadow-sm hover:shadow
                                  hover:bg-blue-600
                                  dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200
                                `
                                            }
                            `}
                >
                  <FaMoneyBill />
                  Cobrar
                </button>

                <button
                  onClick={() => handleVerPagos(deuda.iddeuda)}
                  className="
                    flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                    bg-blue-500 text-white shadow-sm hover:shadow hover:bg-blue-600
                    dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200
                  "
                >
                  <FaFileAlt />
                  Ver Pagos
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
      )}

    </div>
  );
};

export default DetallesCreditosCliente;
