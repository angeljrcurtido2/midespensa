import { CHAT_IA_HABILITADO } from '../../config/featureFlags';
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';
import { PaginaListado, EncabezadoListado, BotonPrincipal, BotonSecundario, BarraFiltros, CampoBusqueda, TablaListado, AccionFila, Insignia } from '../../components/listado/Listado';
import {
    FaTruck,
    FaEdit,
    FaTrash,
    FaCheck
} from 'react-icons/fa';
import { deleteProveedor, getProveedoresPaginated, getReportListProvider, getReportProveedoresPDF } from '../../services/proveedor';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import ModalAdvert from '../../components/ModalAdvert';
import { ReporteProveedor } from './ReporteProveedor';
import type { ReporteProveedoresResponse } from '../../types/reporte.types';
import ChatProveedorModal from './ChatProveedorModal';
import SelectPage from '../../components/SelectPage';
import SelectPagination from '../../components/SelectPagination';
import { descargarPdfBase64, fechaParaNombreArchivo } from '../../utils/descargarPdf';

interface ListarProveedoresProps {
    onSelect?: (proveedor: any) => void;
}

const ListarProveedores = ({ onSelect }: ListarProveedoresProps) => {
    const [proveedores, setProveedores] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
    const [advertMessage, setAdvertMessage] = useState("");
    const [advertAction, setAdvertAction] = useState<(() => void) | null>(null);
    const [datosReporte, setDatosReporte] = useState<ReporteProveedoresResponse | null>(null);
    const [mostrarReporte, setMostrarReporte] = useState(false);
    const [chatProveedorVisible, setChatProveedorVisible] = useState(false);
    const navigate = useNavigate();
    useAlVolverALaVentana(() => { void fetchProveedores(); });


    const fetchProveedores = async () => {
        try {
            const res = await getProveedoresPaginated({ page, limit, search });
            setProveedores(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Error al obtener proveedores:', error);
        }
    };

    const handleDelete = (id: number) => {
        setAdvertMessage('¿Estás seguro de que deseas eliminar este proveedor?');
        setAdvertAction(() => async () => {
            try {
                await deleteProveedor(id);
                setSuccessMessage('   Proveedor eliminado exitosamente');
                fetchProveedores();
            } catch (error) {
                console.error('Error al eliminar proveedor:', error);
                setErrorMessage('  No se pudo eliminar el proveedor');
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
        fetchProveedores();
    }, [page, limit, search]);

    const handleCloseChatModal = useCallback(() => {
        setChatProveedorVisible(false);
    }, []);

    const handleProveedorActuado = useCallback(() => {
        console.log('   Proveedor actuado');
        fetchProveedores();
    }, [page, limit, search]);

    const handleGenerateReporteList = async () => {
        try {
            const res = await getReportListProvider(search);
            console.log("📊 Respuesta del servidor:", res.data);

            const proveedores = res.data.data || res.data;
            const estadisticas = res.data.estadisticas || {};

            const totalProveedores = estadisticas.total_proveedores || proveedores.length;
            const proveedoresActivos = estadisticas.proveedores_activos || proveedores.filter((p: any) => p.estado === 'activo').length;
            const proveedoresInactivos = estadisticas.proveedores_inactivos || proveedores.filter((p: any) => p.estado === 'inactivo').length;

            const reporteTransformado: ReporteProveedoresResponse = {
                message: '   Reporte de proveedores generado correctamente',
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
                        titulo: 'Reporte de Proveedores',
                        total_proveedores: totalProveedores,
                        proveedores_activos: proveedoresActivos,
                        proveedores_inactivos: proveedoresInactivos,
                        total_compras_general: estadisticas.total_compras_general || 0,
                        monto_total_comprado: estadisticas.monto_total_comprado || '0',
                        proveedores: proveedores
                    }
                }
            };

            setDatosReporte(reporteTransformado);
            setMostrarReporte(true);
        } catch (error) {
            console.error("  Error al generar reporte de proveedores:", error);
            setErrorMessage("  Error al generar el reporte");
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const res = await getReportProveedoresPDF(search);
            descargarPdfBase64(
                res.data.reportePDFBase64,
                `Reporte-Proveedores-${fechaParaNombreArchivo()}.pdf`
            );
        } catch (error) {
            console.error("  Error al generar PDF de proveedores:", error);
            setErrorMessage("  Error al generar el PDF");
        }
    };

    // El selector y la pantalla administrativa comparten el listado moderno,
    // alineado con las pantallas de Compras y Ventas.
    {
        return (
            <PaginaListado>
                <EncabezadoListado
                    icono={<FaTruck />}
                    titulo={onSelect ? "Seleccionar proveedor" : "Proveedores"}
                    subtitulo={onSelect ? "Elegí un proveedor para asociarlo a la compra" : "A quiénes les comprás"}
                    acciones={!onSelect ? <BotonPrincipal color="azul" onClick={() => navigate('/proveedor/nuevo')}>Nuevo proveedor</BotonPrincipal> : undefined}
                />
                <BarraFiltros
                    derecha={
                        <>
                            {!onSelect && CHAT_IA_HABILITADO && <BotonSecundario onClick={() => setChatProveedorVisible(true)}>Chat IA</BotonSecundario>}
                            {!onSelect && <BotonSecundario onClick={handleGenerateReporteList}>Reporte PDF</BotonSecundario>}
                            <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
                        </>
                    }
                >
                    <CampoBusqueda valor={search} onCambio={(v) => { setSearch(v); setPage(1); }} placeholder="Nombre, RUC o teléfono…" />
                </BarraFiltros>

                <TablaListado
                    filas={proveedores}
                    claveFila={(p) => p.idproveedor}
                    vacio={search ? 'No se encontraron proveedores con ese criterio de búsqueda' : 'Todavía no hay proveedores registrados'}
                    anchoMinimo={860}
                    columnas={[
                        { clave: 'prov', titulo: 'Proveedor', render: (p) => (<><p className="font-bold text-slate-900 dark:text-slate-100">{p.nombre}</p>{p.razon && <p className="text-xs text-slate-500">{p.razon}</p>}</>) },
                        { clave: 'ruc', titulo: 'RUC', sinSalto: true, render: (p) => p.ruc || '—' },
                        { clave: 'tel', titulo: 'Teléfono', sinSalto: true, render: (p) => p.telefono || '—' },
                        { clave: 'correo', titulo: 'Correo', render: (p) => p.correo || '—' },
                        { clave: 'dir', titulo: 'Dirección', render: (p) => p.direccion || '—' },
                        { clave: 'estado', titulo: 'Estado', render: (p) => <Insignia color={p.estado === 'inactivo' ? 'rojo' : 'verde'}>{p.estado === 'inactivo' ? 'Inactivo' : 'Activo'}</Insignia> },
                    ]}
                    acciones={(p) => onSelect ? (
                        <AccionFila icono={<FaCheck />} texto="Seleccionar" onClick={() => onSelect(p)} />
                    ) : (
                        <>
                            <AccionFila icono={<FaEdit />} texto="Editar" onClick={() => navigate(`/proveedor/editar/${p.idproveedor}`)} />
                            <AccionFila icono={<FaTrash />} texto="Borrar" tipo="peligro" onClick={() => handleDelete(p.idproveedor)} />
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
                    <ReporteProveedor
                        reporte={datosReporte.datosReporte.reporte}
                        onClose={() => setMostrarReporte(false)}
                        onDownloadPDF={handleDownloadPDF}
                    />
                )}
                {CHAT_IA_HABILITADO && (
                    <ChatProveedorModal visible={chatProveedorVisible} onClose={handleCloseChatModal} onProveedorActuado={handleProveedorActuado} />
                )}
            </PaginaListado>
        );
    }


};

export default ListarProveedores;
