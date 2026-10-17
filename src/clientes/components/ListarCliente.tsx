import { CHAT_IA_HABILITADO } from '../../config/featureFlags';
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';
import { PaginaListado, EncabezadoListado, BotonPrincipal, BotonSecundario, BarraFiltros, CampoBusqueda, TablaListado, AccionFila, Insignia } from '../../components/listado/Listado';
import {
    FaUsers,
    FaSearch,
    FaEdit,
    FaTrash,
    FaFileAlt,
    FaUserCheck,
    FaCheck
} from 'react-icons/fa';
import { getClientPaginated, deleteClient, getReportListClient, getReportClientesPDF } from '../../services/cliente';
import ModalCrearCliente from './ModalsCliente/ModalCrearCliente';
import ModalEditarCliente from './ModalsCliente/ModalEditarCliente';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import ModalAdvert from '../../components/ModalAdvert';
import { ReporteClientes } from './ReporteClientes';
import { descargarPdfBase64, fechaParaNombreArchivo } from '../../utils/descargarPdf';
import ChatClienteModal from './ChatClienteModal';
import type { ReporteClientesResponse } from '../../types/reporte.types';
import ButtonGrid from '../../components/ButtonGrid';
import SelectPage from '../../components/SelectPage';
import SelectPagination from '../../components/SelectPagination';
import CardText from '../../ventas/components/CobroDeudaVenta/components/CardText';
import ButtonGral from '../../components/ButtonGral';
import { styleCardSmall, styleSearchDark, styleTxtCards, styleTxtLabelBold } from '../../components/utils/stylesGral';
import { DateInput } from '../../components/DatePicker';
interface ListarClienteProps {
    onSelect?: (cliente: any) => void;
    isReportGenerated?: boolean;
    onReportGenerated?: (idcliente: number) => void;
}

const ListarCliente = ({ onSelect, isReportGenerated, onReportGenerated }: ListarClienteProps) => {
    const [clientes, setClientes] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [modalCrearClienteOpen, setModalCrearClienteOpen] = useState(false);
    const [modalEditarClienteOpen, setModalEditarClienteOpen] = useState(false);
    const [idCliente, setIdCliente] = useState<number | string>('');
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
    const [advertMessage, setAdvertMessage] = useState("");
    const [advertAction, setAdvertAction] = useState<(() => void) | null>(null);
    const [datosReporte, setDatosReporte] = useState<ReporteClientesResponse | null>(null);
    const [mostrarReporte, setMostrarReporte] = useState(false);
    const [chatClienteVisible, setChatClienteVisible] = useState(false);
    const [vistaGrid, setVistaGrid] = useState(true); // true = grid, false = lista
    const modoPagina: boolean = !onSelect && !isReportGenerated;
    const navigate = useNavigate();
    useAlVolverALaVentana(() => { void fetchClientes(); });


    const fetchClientes = async () => {
        try {
            const res = await getClientPaginated({ page, limit, search });
            setClientes(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Error al obtener clientes:', error);
        }
    };

    const handleDelete = (id: number) => {
        setAdvertMessage('¿Estás seguro de que deseas eliminar este cliente?');
        setAdvertAction(() => async () => {
            try {
                await deleteClient(id);
                setSuccessMessage('  Cliente eliminado exitosamente');
                fetchClientes();
            } catch (error) {
                console.error('Error al eliminar cliente:', error);
                setErrorMessage('  No se pudo eliminar el cliente');
            }
        });
        setModalAdvertOpen(true);
    };

    const handleConfirmAdvert = () => {
        if (advertAction) {
            advertAction();
        }
        setModalAdvertOpen(false);
        setAdvertAction(null);
    };

    useEffect(() => {
        fetchClientes();
    }, [page, limit, search]);

    const handleEdit = (id: number) => {
        setIdCliente(id);
        setModalEditarClienteOpen(true);
    };

    const handleCloseChatModal = useCallback(() => {
        setChatClienteVisible(false);
    }, []);

    const handleClienteActuado = useCallback(() => {
        console.log('  Cliente actuado');
        fetchClientes();
    }, [page, limit, search]);

    const handleGenerateReport = (idcliente: number) => {
        onReportGenerated && onReportGenerated(idcliente);
        console.log(`Generando reporte para cliente con ID: ${idcliente}`);
    };

    const handleGenerateReporteList = async () => {
        try {
            const res = await getReportListClient(search);
            console.log("📊 Respuesta del servidor:", res.data);

            const clientes = res.data.data || res.data;

            const totalClientes = clientes.length;
            const clientesActivos = clientes.filter((c: any) => c.estado === 'activo').length;
            const clientesInactivos = clientes.filter((c: any) => c.estado === 'inactivo').length;

            const reporteTransformado: ReporteClientesResponse = {
                message: '  Reporte de clientes generado correctamente',
                datosReporte: {
                    empresa: {
                        nombre_fantasia: '',
                        ruc: '',
                        timbrado_nro: '',
                        fecha_inicio_vigente: '',
                        fecha_fin_vigente: '',
                        fecha_emision: new Date().toLocaleDateString('es-PY')
                    },
                    reporte: {
                        titulo: 'Reporte de Clientes',
                        total_clientes: totalClientes,
                        clientes_activos: clientesActivos,
                        clientes_inactivos: clientesInactivos,
                        clientes: clientes.map((c: any) => ({
                            idcliente: c.idcliente,
                            nombre: c.nombre,
                            apellido: c.apellido,
                            nro_documento: c.numDocumento,
                            telefono: c.telefono,
                            correo: c.correo || '',
                            direccion: c.direccion,
                            ciudad: c.ciudad || '',
                            pais: c.pais || '',
                            tipo_documento: c.tipo_documento,
                            tipo_cliente: c.tipo_cliente,
                            estado: c.estado,
                            created_at: c.created_at,
                            updated_at: c.updated_at,
                            total_compras: c.total_compras || 0,
                            monto_total_comprado: c.monto_total_comprado || '0',
                            ultima_compra: c.ultima_compra || ''
                        }))
                    }
                }
            };

            setDatosReporte(reporteTransformado);
            setMostrarReporte(true);
        } catch (error) {
            console.error("  Error al generar reporte de clientes:", error);
            setErrorMessage("  Error al generar el reporte");
        }
    };

    const handleDownloadPDF = async (tipoClienteFiltro: string) => {
        try {
            const res = await getReportClientesPDF(search, tipoClienteFiltro);
            descargarPdfBase64(
                res.data.reportePDFBase64,
                `Reporte-Clientes-${fechaParaNombreArchivo()}.pdf`
            );
        } catch (error) {
            console.error("  Error al generar PDF de clientes:", error);
            setErrorMessage("  Error al generar el PDF");
        }
    };

    const getEstadoBadgeColor = (estado: string) => {
        if (estado === 'activo') return 'bg-green-100 text-green-700 border-green-300';
        return 'bg-red-100 text-red-700 border-red-300';
    };


    if (modoPagina) {
        return (
            <PaginaListado>
                <EncabezadoListado
                    icono={<FaUsers />}
                    titulo="Clientes"
                    subtitulo="Tu cartera de clientes"
                    acciones={<BotonPrincipal onClick={() => navigate('/clientes/nuevo')}>Nuevo cliente</BotonPrincipal>}
                />
                <BarraFiltros
                    derecha={
                        <>
                            {CHAT_IA_HABILITADO && <BotonSecundario onClick={() => setChatClienteVisible(true)}>Chat IA</BotonSecundario>}
                            <BotonSecundario onClick={handleGenerateReporteList}>Reporte PDF</BotonSecundario>
                            <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
                        </>
                    }
                >
                    <CampoBusqueda valor={search} onCambio={(v) => { setSearch(v); setPage(1); }} placeholder="Nombre, apellido, documento o teléfono…" />
                </BarraFiltros>

                <TablaListado
                    filas={clientes}
                    claveFila={(c) => c.idcliente}
                    vacio={search ? 'No se encontraron clientes con ese criterio de búsqueda' : 'Todavía no hay clientes registrados'}
                    anchoMinimo={900}
                    columnas={[
                        { clave: 'cliente', titulo: 'Cliente', render: (c) => (<><p className="font-bold text-slate-900 dark:text-slate-100">{c.nombre} {c.apellido}</p><p className="text-xs text-slate-500">{c.tipo_cliente}</p></>) },
                        { clave: 'doc', titulo: 'Documento', sinSalto: true, render: (c) => c.numDocumento || '—' },
                        { clave: 'tel', titulo: 'Teléfono', sinSalto: true, render: (c) => c.telefono || '—' },
                        { clave: 'correo', titulo: 'Correo', render: (c) => c.correo || '—' },
                        { clave: 'dir', titulo: 'Dirección', render: (c) => c.direccion || '—' },
                        { clave: 'estado', titulo: 'Estado', render: (c) => <Insignia color={c.estado === 'activo' ? 'verde' : 'rojo'}>{c.estado === 'activo' ? 'Activo' : 'Inactivo'}</Insignia> },
                    ]}
                    acciones={(c) => (
                        <>
                            <AccionFila icono={<FaEdit />} texto="Editar" onClick={() => navigate(`/clientes/editar/${c.idcliente}`)} />
                            <AccionFila icono={<FaTrash />} texto="Borrar" tipo="peligro" onClick={() => handleDelete(c.idcliente)} />
                        </>
                    )}
                />

                <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />

                <ModalError isOpen={!!errorMessage} onClose={() => setErrorMessage("")} message={errorMessage} />
                <ModalSuccess isOpen={!!successMessage} onClose={() => setSuccessMessage("")} message={successMessage} />
                <ModalAdvert
                    isOpen={modalAdvertOpen}
                    onClose={() => setModalAdvertOpen(false)}
                    message={advertMessage}
                    onConfirm={handleConfirmAdvert}
                    confirmButtonText="Confirmar"
                />
                {mostrarReporte && datosReporte && datosReporte.datosReporte && datosReporte.datosReporte.reporte && (
                    <ReporteClientes
                        reporte={datosReporte.datosReporte.reporte}
                        onClose={() => setMostrarReporte(false)}
                        onDownloadPDF={handleDownloadPDF}
                    />
                )}
                {CHAT_IA_HABILITADO && (
                    <ChatClienteModal visible={chatClienteVisible} onClose={handleCloseChatModal} onClienteActuado={handleClienteActuado} />
                )}
            </PaginaListado>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarGutter: 'stable' }}>
            <div className="max-w-7xl mx-auto">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 text-white">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 md:gap-5">
                        <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 md:p-5 rounded-2xl shrink-0">
                            <FaUsers className="text-white text-2xl sm:text-3xl md:text-4xl" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-1">Gestión de Clientes</h1>
                            <p className="text-xs sm:text-sm md:text-base text-blue-100">Administra tu cartera de clientes</p>
                        </div>
                    </div>
                </div>
                

                {/* Controles superiores */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-5 md:mb-6">
                    <div className="flex flex-col gap-3 sm:gap-4">

                        {/* Buscador */}
                        <div className="relative w-full">
                            <FaSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, apellido, documento o teléfono..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className={styleSearchDark}
                            />
                        </div>

                        {/* Filtro y botones */}
                        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center justify-between">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
                                <ButtonGrid onClick={(isGrid) => setVistaGrid(isGrid)} vistaGrid={vistaGrid} />
                            </div>

                            {/* Botones de acción */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        
                                <ButtonGral text="Nuevo Cliente" onClick={() => setModalCrearClienteOpen(true)} />
                                {CHAT_IA_HABILITADO && (
<ButtonGral text='Chat IA' onClick={() => setChatClienteVisible(true)} />
)}
                                <ButtonGral text="Reporte PDF" onClick={handleGenerateReporteList} />
                                <DateInput/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vista condicional: Grid o Lista */}
                <div className={vistaGrid ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4" : "grid grid-cols-1 gap-3"}>
                    {clientes.map((cliente) => (
                        <div
                            key={cliente.idcliente}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-500"
                        >
                            {/* Header */}
                            <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-gray-700 dark:to-gray-800 text-white">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="bg-white/20 p-2 rounded-lg">
                                            <FaUserCheck size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm sm:text-base truncate">{cliente.nombre} {cliente.apellido}</h3>
                                            <p className="text-xs opacity-90">{cliente.tipo_cliente}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getEstadoBadgeColor(cliente.estado)}`}>
                                        {cliente.estado}
                                    </span>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-3 sm:p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <CardText title="Documento" text={cliente.numDocumento || 'N/A'} containerClass={styleCardSmall} titleClass={styleTxtCards} textClass={styleTxtLabelBold} />
                                    <CardText title="Teléfono" text={cliente.telefono || 'N/A'} containerClass={styleCardSmall} titleClass={styleTxtCards} textClass={styleTxtLabelBold} />
                                    {cliente.correo && <CardText title="Email" text={cliente.correo} containerClass={styleCardSmall} titleClass={styleTxtCards} textClass={styleTxtLabelBold} />}
                                    {cliente.direccion && <CardText title="Dirección" text={cliente.direccion} containerClass={styleCardSmall} titleClass={styleTxtCards} textClass={styleTxtLabelBold} />}
                                </div>

                                {/* Acciones */}
                                <div className="pt-3 border-t border-blue-100 dark:border-gray-600">
                                    {isReportGenerated ? (
                                        <button
                                            onClick={() => handleGenerateReport(cliente.idcliente)}
                                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                                        >
                                            <FaFileAlt /> Generar Reporte
                                        </button>
                                    ) : onSelect ? (
                                        <button
                                            onClick={() => onSelect(cliente)}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                                        >
                                            <FaCheck /> Seleccionar
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(cliente.idcliente)}
                                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                                            >
                                                <FaEdit /> Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cliente.idcliente)}
                                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                                            >
                                                <FaTrash /> Borrar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
            </div>

            {/* Modales */}
            <ModalCrearCliente
                isOpen={modalCrearClienteOpen}
                onClose={() => setModalCrearClienteOpen(false)}
                onSuccess={fetchClientes}
            />
            <ModalEditarCliente
                isOpen={modalEditarClienteOpen}
                onClose={() => setModalEditarClienteOpen(false)}
                id={idCliente}
                onSuccess={fetchClientes}
            />
            <ModalError isOpen={!!errorMessage} onClose={() => setErrorMessage("")} message={errorMessage} />
            <ModalSuccess isOpen={!!successMessage} onClose={() => setSuccessMessage("")} message={successMessage} />
            <ModalAdvert
                isOpen={modalAdvertOpen}
                onClose={() => setModalAdvertOpen(false)}
                message={advertMessage}
                onConfirm={handleConfirmAdvert}
                confirmButtonText="Confirmar"
            />

            {/* Modal de Reporte de Clientes */}
            {mostrarReporte && datosReporte && datosReporte.datosReporte && datosReporte.datosReporte.reporte && (
                <ReporteClientes
                    reporte={datosReporte.datosReporte.reporte}
                    onClose={() => setMostrarReporte(false)}
                    onDownloadPDF={handleDownloadPDF}
                />
            )}

            {/* Modal de Chat IA para Clientes */}
            {CHAT_IA_HABILITADO && (
<ChatClienteModal
                visible={chatClienteVisible}
                onClose={handleCloseChatModal}
                onClienteActuado={handleClienteActuado}
            />
)}
        </div>
    );
};

export default ListarCliente;
