'use client';

import { useEffect, useState } from 'react';
import { TrashIcon, CreditCardIcon, CalendarIcon, DocumentTextIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { FaChevronLeft, FaChevronRight, FaInfoCircle, FaFilePdf } from 'react-icons/fa';
import { listarDetallePagosDeudaCompleto } from '../../../services/ventas';
import { listarDetallePagosDeudaVenta, anularPagoDeudaVenta, comprobantePagoDeudaDetalleId } from '../../../services/ventas';
import ModalDetallePagoDeuda from './components/ModalDetallePagoDeudas';
import ModalAdvert from '../../../components/ModalAdvert';
import ModalSuccess from '../../../components/ModalSuccess';
import { formatPY } from '../../../movimiento/utils/utils';
import ModalError from '../../../components/ModalError';
import { descargarPdfBase64 } from '../../../utils/descargarPdf';

interface DetallePago {
  idpago_deuda: number;
  monto_pagado: string;
  fecha_pago: string;
  observacion: string;
  metodo_pago: string;
  creado_por: string;
  creador_nombre: string;
  creador_apellido: string;
  creador_tipo: string;

}

interface Props {
  iddeuda: number;
  onSuccess?: () => void;
}

const ListarDetallesPagosDeuda: React.FC<Props> = ({ iddeuda, onSuccess }) => {
  const [detalles, setDetalles] = useState<DetallePago[]>([]);
  const [showAdvert, setShowAdvert] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [idPagoAAnular, setIdPagoAAnular] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [errorMessage, setErrorMessage] = useState("");
  const [advertMessage, setAdvertMessage] = useState("");
  const [loadingPdfId, setLoadingPdfId] = useState<number | null>(null);

  const fetchDetalles = async () => {
    setLoading(true);
    try {
      const response = await listarDetallePagosDeudaVenta(iddeuda, {
        page,
        limit,
        search: "",
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
      });

      setDetalles(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error al cargar detalles de pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnular = (idpago: number) => {
    setIdPagoAAnular(idpago);
    setShowAdvert(true);
  };

  const confirmarAnulacion = async () => {
    if (idPagoAAnular === null) return;

    try {
      await anularPagoDeudaVenta(idPagoAAnular);
      setSuccessModalOpen(true)
      fetchDetalles();
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Error al anular el pago:', error);
      setErrorMessage('  Error al anular el pago.');
    } finally {
      setShowAdvert(false);
      setIdPagoAAnular(null);
    }
  };

  const handleOpenDetalle = (pago: any) => {
    setPagoSeleccionado(pago);
    setModalOpen(true);
  };

  useEffect(() => {
    fetchDetalles();
  }, [page, limit, fechaInicio, fechaFin]);

  const handleReImprimir = async (idpago_deuda: number) => {
    setLoadingPdfId(idpago_deuda);
    try {
      const comprobante = await comprobantePagoDeudaDetalleId(idpago_deuda);

      if (comprobante.data?.comprobanteBase64) {
        const base64 = comprobante.data.comprobanteBase64;
        const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error al reimprimir:', error);
      setErrorMessage('Error al generar el comprobante');
    } finally {
      setLoadingPdfId(null);
    }
  };

  const handleGenerarReporte = async () => {
    try {
      const response = await listarDetallePagosDeudaCompleto(iddeuda);

      const base64 = response.data.comprobanteBase64 || response.data.reporteBase64 || response.data.reportePDFBase64;

      if (!base64) {
        setAdvertMessage("⚠️ No se encontró el archivo PDF en la respuesta.");
        return;
      }

      descargarPdfBase64(base64, `Reporte_Pagos_Cliente_${iddeuda}.pdf`);
    } catch (error) {
      console.error("  Error al generar el reporte completo:", error);
      setErrorMessage("  Error al generar el reporte.");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <CreditCardIcon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Historial de Pagos</h2>
              <p className="text-blue-100 text-sm">Registro completo de transacciones</p>
            </div>
          </div>
          <button
            onClick={handleGenerarReporte}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
          >
            <FaFilePdf className="text-lg" />
            Generar Reporte
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="
        mb-6 rounded-xl p-4 border
        bg-blue-50 border-blue-200
        dark:bg-gray-800 dark:border-gray-700
      ">
        <div className="flex flex-wrap items-end gap-4">

          {/* Fecha inicio */}
          <div className="flex-1 min-w-[200px]">
            <label className="
              block text-sm font-medium mb-2 flex items-center gap-2
              text-blue-700
              dark:text-gray-300
            ">
              <CalendarIcon className="h-4 w-4" />
              Fecha inicio
            </label>

            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setPage(1);
              }}
              className="
                w-full px-3 py-2 rounded-lg shadow-sm
                border border-blue-300
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                bg-white text-gray-900
                dark:bg-gray-900 dark:text-white
                dark:border-gray-600
                dark:focus:ring-gray-500 dark:focus:border-gray-500
              "
            />
          </div>

          {/* Fecha fin */}
          <div className="flex-1 min-w-[200px]">
            <label className="
              block text-sm font-medium mb-2 flex items-center gap-2
              text-blue-700
              dark:text-gray-300
            ">
              <CalendarIcon className="h-4 w-4" />
              Fecha fin
            </label>

            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setPage(1);
              }}
              className="
                w-full px-3 py-2 rounded-lg shadow-sm
                border border-blue-300
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                bg-white text-gray-900
                dark:bg-gray-900 dark:text-white
                dark:border-gray-600
                dark:focus:ring-gray-500 dark:focus:border-gray-500
              "
            />
          </div>

          {/* Items por página */}
          <div className="w-[150px]">
            <label className="
              block text-sm font-medium mb-2
              text-blue-700
              dark:text-gray-300
            ">
              Mostrar
            </label>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
              className="
                  w-full px-3 py-2 rounded-lg shadow-sm
                  border border-blue-300
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  bg-white text-gray-900
                  dark:bg-gray-900 dark:text-white
                  dark:border-gray-600
                  dark:focus:ring-gray-500 dark:focus:border-gray-500
                "
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
            </select>
          </div>

        </div>
      </div>


      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div
            className="
              animate-spin rounded-full h-12 w-12
              border-t-2 border-b-2
              border-blue-600
              dark:border-gray-400
            "
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && detalles.length === 0 && (
        <div
          className="
            text-center py-12 rounded-xl
            bg-gray-50
            dark:bg-gray-800
          "
        >
          <FaInfoCircle
            className="
              text-gray-400 text-5xl mx-auto mb-4
              dark:text-gray-500
            "
          />
          <p
            className="
              text-gray-500 text-lg
              dark:text-gray-300
            "
          >
            No hay registros de pagos encontrados
          </p>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && detalles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {detalles.map((item, idx) => (
            <div
              key={item.idpago_deuda}
              className="
                rounded-xl p-5 border transition-all
                border-blue-200 bg-gradient-to-br from-white to-blue-50 hover:border-blue-400 hover:shadow-lg
                dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800
                dark:hover:border-gray-500
              "
            >
              {/* Header del card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      rounded-full w-10 h-10 flex items-center justify-center font-bold
                      bg-blue-100 text-blue-700
                      dark:bg-gray-700 dark:text-white
                    "
                  >
                    #{(page - 1) * limit + idx + 1}
                  </div>

                  <div>
                    <p
                      className="
                        text-2xl font-bold
                        text-blue-900
                        dark:text-white
                      "
                    >
                      {formatPY(item.monto_pagado)}
                    </p>
                  </div>
                </div>

                <div
                  className="
                    p-2 rounded-lg
                    bg-blue-100
                    dark:bg-gray-700
                  "
                >
                  <CreditCardIcon className="h-6 w-6 text-blue-600 dark:text-gray-200" />
                </div>
              </div>

              {/* Información de fecha y creador */}
              <div
                className="
                  text-xs mb-4 pb-4 flex flex-row gap-3 px-3 py-1.5 rounded-lg border
                  bg-blue-50 border-blue-200
                  dark:bg-gray-800 dark:border-gray-700
                "
              >
                <div
                  className="
                  flex items-center gap-2 text-sm
                  text-blue-700
                  dark:text-gray-300
                "
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="font-medium text-xs">Fecha:</span>
                  <span className="font-medium text-xs">
                    {formatDate(item.fecha_pago)}
                  </span>
                </div>

                {/* Información del creador */}
                {item.creador_nombre && item.creador_apellido && (
                  <div className="flex items-center">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-blue-500 dark:text-gray-400 whitespace-nowrap">
                        Cobrado por
                      </span>
                      <span className="text-xs text-blue-400 dark:text-gray-500">•</span>
                      <span className="font-semibold text-blue-700 dark:text-gray-200">
                        {item.creador_nombre} {item.creador_apellido}
                      </span>
                      <span className="text-xs text-blue-400 dark:text-gray-500">•</span>
                      <span className="text-xs text-blue-500 dark:text-gray-400">
                        {item.creador_tipo === 'usuario' ? 'Usuario' : 'Funcionario'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleOpenDetalle(item)}
                  className="
                    flex flex-col items-center justify-center gap-1 p-3 rounded-lg font-medium shadow-sm transition-all
                    bg-blue-100 hover:bg-blue-200 text-blue-700 hover:shadow
                    dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200
                  "
                >
                  <DocumentTextIcon className="h-5 w-5" />
                  <span className="text-xs">Detalles</span>
                </button>

                <button
                  onClick={() => handleReImprimir(item.idpago_deuda)}
                  disabled={loadingPdfId === item.idpago_deuda}
                  className="
                        flex flex-col items-center justify-center gap-1 p-3 rounded-lg font-medium shadow-sm transition-all
                        bg-blue-500 hover:bg-blue-600 text-white hover:shadow
                        dark:bg-gray-600 dark:hover:bg-gray-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                >
                  <PrinterIcon className="h-5 w-5" />
                  <span className="text-xs">
                    {loadingPdfId === item.idpago_deuda ? 'Abriendo...' : 'Imprimir'}
                  </span>
                </button>

                <button
                  onClick={() => handleAnular(item.idpago_deuda)}
                  className="
                    flex flex-col items-center justify-center gap-1 p-3 rounded-lg font-medium shadow-sm transition-all
                    bg-blue-100 hover:bg-blue-200 text-blue-700 hover:shadow
                    dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200
                  "
                >
                  <TrashIcon className="h-5 w-5" />
                  <span className="text-xs">Anular</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="text-sm text-blue-700">
            Mostrando {detalles.length} pagos
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`p-2 rounded-lg ${page === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
            >
              <FaChevronLeft />
            </button>
            <span className="text-sm font-medium text-blue-700">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className={`p-2 rounded-lg ${page === totalPages
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
      <ModalAdvert
        isOpen={showAdvert}
        onClose={() => setShowAdvert(false)}
        onConfirm={confirmarAnulacion}
        message="¿Estás seguro de que deseas anular este pago? Esta acción actualizará la deuda."
        confirmButtonText="Sí, Anular"

      />
      <ModalSuccess
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message="Anulación procesada con éxito"
      />
      <ModalDetallePagoDeuda
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        pago={pagoSeleccionado}
      />
      <ModalError isOpen={!!errorMessage} onClose={() => setErrorMessage("")} message={errorMessage} />
      <ModalAdvert isOpen={!!advertMessage} onClose={() => { setAdvertMessage("") }} message={advertMessage} />

    </div>
  );
};

export default ListarDetallesPagosDeuda;
