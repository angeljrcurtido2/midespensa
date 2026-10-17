'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaFileAlt, FaBook, FaCalculator } from 'react-icons/fa';
import { CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getMovimientosCajaPaginated, getCajaAbierta, generateLibroCajaPDF } from '../../../services/movimiento';
import { generateLibroDiarioPDF, generateLibroMayorPDF } from '../../../services/contabilidad';
import { formatPY } from '../../utils/utils';
import ModalError from '../../../components/ModalError';
import SelectPage from '../../../components/SelectPage';
import SelectPagination from '../../../components/SelectPagination';
import SearchActionsBar from '../../../components/SearchActionsBar';
import ButtonGral from '../../../components/ButtonGral';
import { renderTitle } from '../../../clientes/utils/utils';
import { descargarPdfBase64 } from '../../../utils/descargarPdf';
import { AccionFila, Insignia, TablaListado } from '../../../components/listado/Listado';
import { useAlVolverALaVentana } from '../../../hooks/useAlVolverALaVentana';

interface MovimientoCaja {
    idmovimiento: number;
    idusuarios: number;
    num_caja: string;
    fecha_apertura: string;
    fecha_cierre: string | null;
    monto_apertura: number;
    monto_cierre: number | null;
    credito: number | null;
    gastos: number | null;
    cobrado: number | null;
    contado: number | null;
    ingresos: number | null;
    compras: number | null;
    estado: string;
    login: string;
}

const ListarMovimientoCaja = () => {
    const navigate = useNavigate();
    const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [aperturaDesde, setAperturaDesde] = useState<string>('');
    const [aperturaHasta, setAperturaHasta] = useState<string>('');
    const [cierreDesde, setCierreDesde] = useState<string>('');
    const [cierreHasta, setCierreHasta] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Estados para modales de selección de fechas
    const [fechaLibroDesde, setFechaLibroDesde] = useState('');
    const [fechaLibroHasta, setFechaLibroHasta] = useState('');


    const fetchMovimientos = async () => {
        try {
            setLoading(true);
            const res = await getMovimientosCajaPaginated({
                page,
                limit,
                search,
                aperturaDesde,
                aperturaHasta,
                cierreDesde,
                cierreHasta,
            });
            setMovimientos(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error('Error al obtener movimientos:', err);
            setErrorMessage('Error al obtener movimientos de caja.');
            setErrorModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovimientos();
    }, [page, limit, search, aperturaDesde, aperturaHasta, cierreDesde, cierreHasta]);

    // Al volver de abrir o cerrar una caja (otra pestaña) la lista se actualiza sola.
    useAlVolverALaVentana(() => { void fetchMovimientos(); });

    const handleOpenModal = (idmovimiento: number) => {
        navigate(`/movimiento/cierrecaja/resumen/${idmovimiento}`);
    };

    const handleOpenApertura = async () => {
        try {
            const res = await getCajaAbierta();
            if (res.data.abierta === false) {
                navigate('/movimiento/cierrecaja/apertura/nueva');
            } else {
                // Mostrar mensaje de error indicando que ya hay una caja abierta
                const numCaja = res.data.num_caja || '';
                setErrorMessage(`Ya existe una caja abierta${numCaja ? ` (Caja #${numCaja})` : ''}. Por favor, cierre la caja actual antes de abrir una nueva.`);
                setErrorModalOpen(true);
            }
        } catch (error) {
            console.error('Error al verificar caja abierta:', error);
            setErrorMessage('Error al verificar el estado de la caja.');
            setErrorModalOpen(true);
        }
    };

    // Generar Libro de Caja con fechas seleccionadas
    const handleGenerarLibroCaja = async (fechaInicio: string, fechaFin: string) => {
        try {
            const res = await generateLibroCajaPDF({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
            descargarPdfBase64(
                res.data.reportePDFBase64,
                `Libro-Caja-SET-${fechaInicio}_${fechaFin}.pdf`
            );
        } catch (error) {
            console.error("  Error al generar Libro de Caja:", error);
            setErrorMessage("  Error al generar el Libro de Caja");
            setErrorModalOpen(true);
        }
    };

    // Generar Libro Diario con fechas seleccionadas
    const handleGenerarLibroDiario = async (fechaInicio: string, fechaFin: string) => {
        try {
            const res = await generateLibroDiarioPDF({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
            descargarPdfBase64(
                res.data.reportePDFBase64,
                `Libro-Diario-${fechaInicio}_${fechaFin}.pdf`
            );
        } catch (error) {
            console.error("  Error al generar Libro Diario:", error);
            setErrorMessage("  Error al generar el Libro Diario");
            setErrorModalOpen(true);
        }
    };

    // Generar Libro Mayor con fechas seleccionadas
    const handleGenerarLibroMayor = async (fechaInicio: string, fechaFin: string) => {
        try {
            const res = await generateLibroMayorPDF({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
            descargarPdfBase64(
                res.data.reportePDFBase64,
                `Libro-Mayor-${fechaInicio}_${fechaFin}.pdf`
            );
        } catch (error) {
            console.error("  Error al generar Libro Mayor:", error);
            setErrorMessage("  Error al generar el Libro Mayor");
            setErrorModalOpen(true);
        }
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-PY', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarGutter: 'stable' }}>
            <div className="max-w-7xl mx-auto">
                {/* Header simplificado */}
                {renderTitle({ title: "Movimientos de Caja", subtitle: "Administra los movimientos de caja", icon: <FaCalculator className="text-white text-3xl sm:text-4xl" /> })}
                {/* Search and Actions Bar */}
                <SearchActionsBar
                    searchValue={search}
                    onSearchChange={(value) => {
                        setSearch(value);
                        setPage(1);
                    }}
                    searchPlaceholder="Buscar por número de caja, estado, usuario..."
                    extraContent={
                        <>
                            {/* Filtros de fecha */}
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex flex-wrap gap-4 flex-1">
                                    {[
                                        { label: 'Apertura desde', value: aperturaDesde, setter: setAperturaDesde, icon: CalendarIcon },
                                        { label: 'Apertura hasta', value: aperturaHasta, setter: setAperturaHasta, icon: CalendarIcon },
                                        { label: 'Cierre desde', value: cierreDesde, setter: setCierreDesde, icon: CalendarIcon },
                                        { label: 'Cierre hasta', value: cierreHasta, setter: setCierreHasta, icon: CalendarIcon },
                                    ].map(({ label, value, setter, icon: Icon }) => (
                                        <div key={label} className="flex-1 min-w-[150px]">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                                            <div className="relative">
                                                <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="date"
                                                    value={value}
                                                    onChange={(e) => {
                                                        setter(e.target.value);
                                                        setPage(1);
                                                    }}
                                                    className="w-full pl-10 pr-8 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                />
                                                {value && (
                                                    <button
                                                        onClick={() => {
                                                            setter('');
                                                            setPage(1);
                                                        }}
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                                                    >
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-4">
                                    <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
                                </div>
                            </div>

                            {/* Botones de reportes */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                <input aria-label="Desde fecha de reporte" type="date" value={fechaLibroDesde} onChange={(e) => setFechaLibroDesde(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-gray-800 dark:text-white" />
                                <input aria-label="Hasta fecha de reporte" type="date" value={fechaLibroHasta} onChange={(e) => setFechaLibroHasta(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-gray-800 dark:text-white" />
                                <ButtonGral text='Libro de Caja SET' icon={<FaBook />} onClick={() => handleGenerarLibroCaja(fechaLibroDesde, fechaLibroHasta)} />
                                <ButtonGral text='Libro Diario' icon={<FaFileAlt />} onClick={() => handleGenerarLibroDiario(fechaLibroDesde, fechaLibroHasta)} />
                                <ButtonGral text='Libro Mayor' icon={<FaCalculator />} onClick={() => handleGenerarLibroMayor(fechaLibroDesde, fechaLibroHasta)} />
                            </div>
                        </>
                    }
                >
                    <ButtonGral text='Abrir Caja' icon={<FaPlus />} onClick={handleOpenApertura} />
                </SearchActionsBar>

                <TablaListado
                    columnas={[
                        { clave: 'caja', titulo: 'Caja', render: (m: MovimientoCaja) => <span className="font-semibold">#{m.num_caja} · {m.login}</span> },
                        { clave: 'estado', titulo: 'Estado', render: (m: MovimientoCaja) => <Insignia color={m.estado === 'abierta' ? 'verde' : 'gris'}>{m.estado.toUpperCase()}</Insignia> },
                        { clave: 'apertura', titulo: 'Apertura', sinSalto: true, render: (m: MovimientoCaja) => formatDateTime(m.fecha_apertura) },
                        { clave: 'cierre', titulo: 'Cierre', sinSalto: true, render: (m: MovimientoCaja) => m.fecha_cierre ? formatDateTime(m.fecha_cierre) : 'Abierta' },
                        { clave: 'monto', titulo: 'Monto apertura', alinear: 'right', sinSalto: true, render: (m: MovimientoCaja) => formatPY(m.monto_apertura) },
                        { clave: 'cobrado', titulo: 'Cobrado', alinear: 'right', sinSalto: true, render: (m: MovimientoCaja) => formatPY(m.cobrado) },
                        { clave: 'gastos', titulo: 'Gastos', alinear: 'right', sinSalto: true, render: (m: MovimientoCaja) => formatPY(m.gastos) },
                    ]}
                    filas={movimientos} claveFila={(m: MovimientoCaja) => m.idmovimiento} cargando={loading}
                    vacio={search || aperturaDesde || cierreDesde ? 'No se encontraron movimientos con ese criterio.' : 'No hay movimientos de caja registrados.'}
                    acciones={(m: MovimientoCaja) => <><AccionFila onClick={() => handleOpenModal(m.idmovimiento)} icono={<FaCalculator />} texto="Resumen" /><AccionFila onClick={() => navigate('/movimiento/cierrecaja/reportes/' + m.idmovimiento)} icono={<FaFileAlt />} texto="Reportes" tipo="neutra" /></>}
                />
                <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
            </div>

            {/* Modales */}
            <ModalError
                isOpen={errorModalOpen}
                onClose={() => setErrorModalOpen(false)}
                message={errorMessage}
            />

            {/* Modales de selección de fechas para reportes */}
        </div>
    );
};

export default ListarMovimientoCaja;
