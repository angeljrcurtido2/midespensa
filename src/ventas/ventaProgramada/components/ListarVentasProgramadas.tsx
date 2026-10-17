"use client";

import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useAlVolverALaVentana } from '../../../hooks/useAlVolverALaVentana';
import { FaCalendarAlt, FaTrash, FaUser, FaBox, FaInfoCircle, FaMoneyBill } from 'react-icons/fa';
import { getCargoUsuario } from "../../../services/usuarios";
import { listarVentasProgramadas, anularVentaProgramada } from "../../../services/ventas";
import { getVentasProgramadasPorCliente } from "../../../services/ventas";
import ModalListClient from "../Modal/ModalListClient";
import ModalAdvert from "../../../components/ModalAdvert";
import ModalError from "../../../components/ModalError";
import ModalSuccess from "../../../components/ModalSuccess";
import ButtonGrid from "../../../components/ButtonGrid";
import SelectPage from "../../../components/SelectPage";
import SelectPagination from "../../../components/SelectPagination";
import CardText from "../../components/CobroDeudaVenta/components/CardText";
import ButtonGral from "../../../components/ButtonGral";
import SearchActionsBar from "../../../components/SearchActionsBar";
import { renderTitle } from "../../../clientes/utils/utils";
import { descargarPdfBase64, fechaParaNombreArchivo } from "../../../utils/descargarPdf";

const ListarVentasProgramadas = () => {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showModalCliente, setShowModalCliente] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showAdvertModal, setShowAdvertModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [idVentaAAnular, setIdVentaAAnular] = useState<number | null>(null);
  const [vistaGrid, setVistaGrid] = useState(true);

  const [cargo, setCargo] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCargo = async () => {
    const { data } = await getCargoUsuario();
    setCargo(data.acceso)
  };
  useEffect(() => {
    fetchCargo()
  }, [])
  const isAdmin = cargo === "Administrador"

  const fetchVentas = async () => {
    try {
      setLoading(true);
      const res = await listarVentasProgramadas({ page, limit, search });
      setVentas(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("  Error al obtener ventas programadas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReporteCliente = async (idcliente: number) => {
    try {
      const res = await getVentasProgramadasPorCliente(idcliente);
      descargarPdfBase64(
        res.data.reportePDFBase64,
        `Ventas-Programadas-${fechaParaNombreArchivo()}.pdf`
      );

    } catch (error) {
      console.error("  Error al generar reporte del cliente:", error);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, [page, limit, search]);

  useAlVolverALaVentana(fetchVentas);

  const handleDelete = (id: number) => {
    setIdVentaAAnular(id);
    setModalMessage("¿Estás seguro de que deseas anular esta venta programada?");
    setShowAdvertModal(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!idVentaAAnular) return;

    try {
      await anularVentaProgramada(idVentaAAnular);
      setModalMessage("  Venta programada anulada correctamente.");
      setShowSuccessModal(true);
      setShowAdvertModal(false)
      fetchVentas();
    } catch (error) {
      console.error("  Error al anular venta programada:", error);
      setModalMessage("  Ocurrió un error al anular la venta programada.");
      setShowErrorModal(true);
    } finally {
      setIdVentaAAnular(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarGutter: 'stable' }}>
      <div className="max-w-7xl mx-auto">
        {renderTitle({
          title: "Ventas Programadas",
          subtitle: "Gestiona las ventas programadas del sistema",
          icon: <FaMoneyBill className="text-white text-4xl" />
        })}
        {/* Búsqueda y controles */}
        <SearchActionsBar
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Buscar por cliente o producto..."
        >
          <ButtonGral text="Nueva Venta Programada" onClick={() => navigate('/ventas/ventaProgramada/nueva')} />
          <ButtonGral text="Reporte por Cliente" onClick={() => setShowModalCliente(true)} />
          <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
          <ButtonGrid onClick={(isGrid) => setVistaGrid(isGrid)} vistaGrid={vistaGrid} />
        </SearchActionsBar>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Lista vacía */}
        {!loading && ventas.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FaInfoCircle className="text-gray-400 text-5xl mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {search
                ? 'No se encontraron ventas programadas con ese criterio de búsqueda'
                : 'No hay ventas programadas registradas'}
            </p>
          </div>
        )}

        {/* Lista de ventas programadas */}
        {!loading && ventas.length > 0 && (
          <div className={vistaGrid ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "grid grid-cols-1 gap-4"}>
            {ventas.map((venta) => (
              <div
                key={venta.idprogramacion}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-500"
              >
                {/* Header con fondo azul */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-gray-700 dark:to-gray-800 p-4 flex flex-row  gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FaUser className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-bold text-white truncate flex-1">
                        {venta.cliente_nombre} {venta.cliente_apellido}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-white text-sm">
                      <div className="flex items-center gap-2">
                        <FaBox className="text-white/80" />
                        <span className="truncate">{venta.nombre_producto}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-white/80" />
                        <span className="truncate">Día {venta.dia_programado}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  {/* Detalles */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { title: "Fecha Inicio", text: new Date(venta.fecha_inicio).toLocaleDateString('es-PY') },
                      { title: "Última Venta", text: venta.ultima_fecha_venta ? new Date(venta.ultima_fecha_venta).toLocaleDateString('es-PY') : "Sin ventas" }
                    ].map((card, index) => (
                      <CardText
                        key={index}
                        title={card.title}
                        text={card.text}
                      />
                    ))}
                  </div>

                  {/* Botón de acción */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(venta.idprogramacion)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all text-sm"
                    >
                      <FaTrash />
                      Anular Programación
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
      </div>
      <ModalSuccess
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={modalMessage}
      />

      <ModalError
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={modalMessage}
      />

      <ModalAdvert
        isOpen={showAdvertModal}
        onClose={() => setShowAdvertModal(false)}
        onConfirm={handleDeleteConfirmed}
        message={modalMessage}
        confirmButtonText="Sí, Anular"
      />
      <ModalListClient
        isOpen={showModalCliente}
        isReportGenerated={showModalCliente}
        onReportGenerated={handleGenerateReporteCliente}
        onClose={() => setShowModalCliente(false)} />
    </div>
  );
};

export default ListarVentasProgramadas;
