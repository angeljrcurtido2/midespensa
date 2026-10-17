import { CHAT_IA_HABILITADO } from '../../config/featureFlags';
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileInvoice, FaEdit, FaTimesCircle, FaCheck } from 'react-icons/fa';
import { fetchAllFacturadores, culminarFacturador, getReportListFacturador, getReportFacturadoresPDF } from '../../services/facturador';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import ModalAdvert from '../../components/ModalAdvert';
import { ReportListFacturator } from './ReportListFacturator';
import type { ReporteFacturadoresResponse } from '../../types/reporte.types';
import ChatFacturadorModal from './ChatFacturadorModal';
import { useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';
import { PaginaListado, EncabezadoListado, BotonPrincipal, BotonSecundario, BarraFiltros, CampoBusqueda, TablaListado, AccionFila, Insignia } from '../../components/listado/Listado';
import SelectPage from '../../components/SelectPage';
import SelectPagination from '../../components/SelectPagination';
import { descargarPdfBase64, fechaParaNombreArchivo } from '../../utils/descargarPdf';

interface ListarFacturadoresProps {
    onSelect?: (facturador: any) => void;
}

const ListarFacturadores = ({ onSelect }: ListarFacturadoresProps) => {
    const navigate = useNavigate();
    const [facturadores, setFacturadores] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
    const [advertMessage, setAdvertMessage] = useState("");
    const [advertAction, setAdvertAction] = useState<(() => void) | null>(null);
    const [datosReporte, setDatosReporte] = useState<ReporteFacturadoresResponse | null>(null);
    const [mostrarReporte, setMostrarReporte] = useState(false);
    const [chatFacturadorVisible, setChatFacturadorVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchFacturadores = async () => {
        setLoading(true);
        try {
            const res = await fetchAllFacturadores(page, limit, search);
            setFacturadores(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Error al obtener facturadores:', error);
        } finally {
            setLoading(false);
        }
    };

    useAlVolverALaVentana(() => { void fetchFacturadores(); });

    const handleEdit = (id: number) => {
        navigate(`/facturador/editar/${id}`);
    };

    const handleCloseChatModal = useCallback(() => {
        setChatFacturadorVisible(false);
    }, []);

    const handleFacturadorActuado = useCallback(() => {
        console.log('  Facturador actuado');
        fetchFacturadores();
    }, [page, limit, search]);

    useEffect(() => {
        fetchFacturadores();
    }, [page, limit, search]);

    const handleCulminar = (id: number) => {
        setAdvertMessage('¿Estás seguro de que deseas culminar este facturador?');
        setAdvertAction(() => async () => {
            try {
                await culminarFacturador(id);
                setSuccessMessage('  Facturador culminado correctamente');
                fetchFacturadores();
            } catch (error) {
                console.error('Error al culminar facturador:', error);
                setErrorMessage('  No se pudo culminar el facturador');
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

    const handleGenerateReporteList = async () => {
        try {
            const res = await getReportListFacturador(search, '');
            console.log("📊 Respuesta del servidor:", res.data);

            // Transformar la respuesta al formato esperado
            const facturadores = res.data.data || res.data;
            const estadisticas = res.data.estadisticas || {};

            // Calcular estadísticas
            const totalFacturadores = estadisticas.total_facturadores || facturadores.length;
            const facturadoresActivos = estadisticas.facturadores_activos || facturadores.filter((f: any) => f.culminado === 'Activo').length;
            const facturadoresCulminados = estadisticas.facturadores_culminados || facturadores.filter((f: any) => f.culminado === 'Culminado').length;

            // Crear estructura de datos esperada
            const reporteTransformado: ReporteFacturadoresResponse = {
                message: '  Reporte de facturadores generado correctamente',
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
                        titulo: 'Reporte de Facturadores',
                        total_facturadores: totalFacturadores,
                        facturadores_activos: facturadoresActivos,
                        facturadores_culminados: facturadoresCulminados,
                        total_ventas_general: estadisticas.total_ventas_general || 0,
                        monto_total_facturado: estadisticas.monto_total_facturado || '0',
                        ganancia_total: estadisticas.ganancia_total || '0',
                        facturas_utilizadas_total: estadisticas.facturas_utilizadas_total || 0,
                        facturas_disponibles_total: estadisticas.facturas_disponibles_total || 0,
                        ventas_pagadas_total: estadisticas.ventas_pagadas_total || 0,
                        ventas_pendientes_total: estadisticas.ventas_pendientes_total || 0,
                        monto_pagado_total: estadisticas.monto_pagado_total || '0',
                        monto_pendiente_total: estadisticas.monto_pendiente_total || '0',
                        facturadores: facturadores
                    }
                }
            };

            setDatosReporte(reporteTransformado);
            setMostrarReporte(true);
        } catch (error) {
            console.error("  Error al generar reporte de facturadores:", error);
            setErrorMessage("  Error al generar el reporte");
        }
    };

    const handleDownloadPDF = async (estadoFiltro: string) => {
        try {
            const res = await getReportFacturadoresPDF(search, estadoFiltro);
            descargarPdfBase64(
                res.data.reportePDFBase64,
                `Reporte-Facturadores-${fechaParaNombreArchivo()}.pdf`
            );
        } catch (error) {
            console.error("  Error al generar PDF de facturadores:", error);
            setErrorMessage("  Error al generar el PDF");
        }
    };

    return (
        <PaginaListado>
            <EncabezadoListado
                icono={<FaFileInvoice />}
                titulo="Facturadores"
                subtitulo="Gestiona tus datos de facturacion legal y timbrados"
                acciones={
                    <>
                        {CHAT_IA_HABILITADO && <BotonSecundario onClick={() => setChatFacturadorVisible(true)}>Chat IA</BotonSecundario>}
                        <BotonSecundario onClick={handleGenerateReporteList}>Reporte PDF</BotonSecundario>
                        <BotonPrincipal color="azul" onClick={() => navigate('/facturador/nuevo')}>Nuevo facturador</BotonPrincipal>
                    </>
                }
            />
            <BarraFiltros
                derecha={<SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />}
            >
                <CampoBusqueda
                    valor={search}
                    onCambio={(valor) => { setSearch(valor); setPage(1); }}
                    placeholder="Buscar por nombre, titular o RUC..."
                />
            </BarraFiltros>

            <TablaListado
                filas={facturadores}
                claveFila={(fact) => fact.idfacturador}
                cargando={loading}
                vacio={search ? 'No se encontraron facturadores con ese criterio de busqueda' : 'No hay facturadores registrados'}
                anchoMinimo={1000}
                columnas={[
                    {
                        clave: 'facturador',
                        titulo: 'Facturador',
                        render: (fact) => (
                            <>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{fact.nombre_fantasia || '-'}</p>
                                <p className="text-xs text-slate-500">{fact.titular || '-'}</p>
                            </>
                        ),
                    },
                    { clave: 'ruc', titulo: 'RUC', sinSalto: true, render: (fact) => fact.ruc || '-' },
                    { clave: 'timbrado', titulo: 'Timbrado', sinSalto: true, render: (fact) => fact.timbrado_nro || '-' },
                    {
                        clave: 'vigencia',
                        titulo: 'Vigencia',
                        sinSalto: true,
                        render: (fact) => (
                            <>
                                <span>{fact.fecha_inicio_vigente ? new Date(fact.fecha_inicio_vigente).toLocaleDateString('es-PY', { timeZone: 'UTC' }) : '-'}</span>
                                <span className="px-1 text-slate-400">a</span>
                                <span>{fact.fecha_fin_vigente ? new Date(fact.fecha_fin_vigente).toLocaleDateString('es-PY', { timeZone: 'UTC' }) : '-'}</span>
                            </>
                        ),
                    },
                    {
                        clave: 'actividades',
                        titulo: 'Actividades economicas',
                        render: (fact) => {
                            const actividades = fact.actividades_economicas || [];
                            return actividades.length
                                ? <span title={actividades.map((a: any) => a.descripcion).join(', ')}>{actividades.length} actividad{actividades.length === 1 ? '' : 'es'}</span>
                                : <span className="text-slate-400">Sin actividades</span>;
                        },
                    },
                    {
                        clave: 'estado',
                        titulo: 'Estado',
                        render: (fact) => {
                            const activo = fact.culminado === 0 || fact.culminado === '0' || fact.culminado === 'Activo';
                            return <Insignia color={activo ? 'verde' : 'rojo'}>{activo ? 'Activo' : 'Culminado'}</Insignia>;
                        },
                    },
                ]}
                acciones={(fact) => onSelect ? (
                    <AccionFila icono={<FaCheck />} texto="Seleccionar" onClick={() => onSelect(fact)} />
                ) : (
                    <>
                        <AccionFila icono={<FaEdit />} texto="Editar" onClick={() => handleEdit(fact.idfacturador)} />
                        <AccionFila icono={<FaTimesCircle />} texto="Culminar" tipo="peligro" onClick={() => handleCulminar(fact.idfacturador)} />
                    </>
                )}
            />

            <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />

            <ModalError isOpen={!!errorMessage} onClose={() => setErrorMessage('')} message={errorMessage} />
            <ModalSuccess isOpen={!!successMessage} onClose={() => setSuccessMessage('')} message={successMessage} />
            <ModalAdvert
                isOpen={modalAdvertOpen}
                onClose={() => setModalAdvertOpen(false)}
                message={advertMessage}
                onConfirm={handleConfirmAdvert}
                confirmButtonText="Confirmar"
            />
            {CHAT_IA_HABILITADO && (
                <ChatFacturadorModal
                    visible={chatFacturadorVisible}
                    onClose={handleCloseChatModal}
                    onFacturadorActuado={handleFacturadorActuado}
                />
            )}
            {mostrarReporte && datosReporte?.datosReporte?.reporte && (
                <ReportListFacturator
                    reporte={datosReporte.datosReporte.reporte}
                    onClose={() => setMostrarReporte(false)}
                    onDownloadPDF={handleDownloadPDF}
                />
            )}
        </PaginaListado>
    );
};

export default ListarFacturadores;
