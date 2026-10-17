import { IA_HABILITADA } from '../../config/featureFlags';
'use client';

import { useEffect, useState } from 'react';
import { FaShoppingCart, FaEye, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import ModalAdvert from '../../components/ModalAdvert';
import { deleteCompra, fetchComprasPaginate, getComprasMonth, getReportListCompra, generateLibroComprasPDF } from '../../services/compras';
import type { ReporteComprasResponse } from '../../types/reporte.types';
import SelectPage from '../../components/SelectPage';
import SelectPagination from '../../components/SelectPagination';
import { descargarPdfBase64 } from '../../utils/descargarPdf';

const ListarCompras = () => {
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [compras, setCompras] = useState<any[]>([]);
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
    const [advertMessage, setAdvertMessage] = useState("");
    const [advertAction, setAdvertAction] = useState<(() => void) | null>(null);
    const [loading, setLoading] = useState(false);
    // Filtro por tipo de compra: 'todas' | 'inventario_inicial' | 'normal'
    const [tipoCompra, setTipoCompra] = useState<'todas' | 'inventario_inicial' | 'normal'>('todas');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');


    const fetchCompras = async () => {
        try {
            setLoading(true);
            const res = await fetchComprasPaginate(page, limit, search, tipoCompra, fechaInicio || undefined, fechaFin || undefined);
            setCompras(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Error al obtener compras:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompras2 = async () => {
        try {
            const res = await getComprasMonth(2025);
            console.log(res)
        } catch (error) {
            console.error('Error al obtener compras:', error);
        }
    };

    const handleDelete = (id: number) => {
        setAdvertMessage('¿Estás seguro de que deseas anular esta compra?');
        setAdvertAction(() => async () => {
            try {
                await deleteCompra(id);
                setSuccessMessage('  Compra anulada exitosamente');
                fetchCompras();
            } catch (error) {
                console.error('Error al anular compra:', error);
                setErrorMessage('  No se pudo anular la compra');
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


    // Al volver a esta ventana (por ejemplo después de registrar una compra) se actualiza la lista.
    useAlVolverALaVentana(() => { void fetchCompras(); void fetchCompras2(); });

    useEffect(() => {
        fetchCompras();
        fetchCompras2();
    }, [page, limit, search, tipoCompra, fechaInicio, fechaFin]);

    const handleGenerateReporteList = async () => {
        try {
            const res = await getReportListCompra(search, fechaInicio, fechaFin, '');
            console.log("📊 Respuesta del servidor:", res.data);

            // Transformar la respuesta al formato esperado
            const compras = res.data.data || res.data;
            const filtros = res.data.filtros || {};
            const estadisticas = res.data.estadisticas || {};

            // Calcular estadísticas
            const totalCompras = estadisticas.total_compras || compras.length;
            const comprasContado = estadisticas.compras_contado || compras.filter((c: any) => c.tipo.toLowerCase() === 'contado').length;
            const comprasCredito = estadisticas.compras_credito || compras.filter((c: any) => c.tipo.toLowerCase() === 'credito').length;

            // Crear estructura de datos esperada
            const reporteTransformado: ReporteComprasResponse = {
                message: '  Reporte de compras generado correctamente',
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
                        titulo: 'Reporte de Compras',
                        fecha_inicio: filtros.fecha_inicio,
                        fecha_fin: filtros.fecha_fin,
                        total_compras: totalCompras,
                        compras_contado: comprasContado,
                        compras_credito: comprasCredito,
                        monto_total_compras: estadisticas.monto_total_compras || '0',
                        monto_total_descuentos: estadisticas.monto_total_descuentos || '0',
                        cantidad_total_productos: estadisticas.cantidad_total_productos || 0,
                        compras: compras
                    }
                }
            };

            sessionStorage.setItem('compras-reporte-actual', JSON.stringify({ reporte: reporteTransformado.datosReporte.reporte, search, fechaInicio, fechaFin }));
            navigate('/compras/reporte');
        } catch (error) {
            console.error("  Error al generar reporte de compras:", error);
            setErrorMessage("  Error al generar el reporte");
        }
    };

    const handleDownloadLibroCompras = async (fechaInicio: string, fechaFin: string) => {
        try {
            console.log('📚 Descargando Libro de Compras SET...');
            const res = await generateLibroComprasPDF({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
            descargarPdfBase64(
                res.data.reportePDFBase64,
                `Libro-Compras-SET-${fechaInicio}-${fechaFin}.pdf`
            );
            console.log('  Libro de Compras descargado exitosamente');
        } catch (error) {
            console.error("  Error al generar Libro de Compras:", error);
            setErrorMessage("  Error al generar el Libro de Compras");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-4 dark:bg-gray-900 sm:px-6" style={{ scrollbarGutter: 'stable' }}>
            <div className="mx-auto w-full max-w-[1800px]">
                {/* Encabezado compacto: título y las acciones principales a la vista */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><FaShoppingCart aria-hidden="true" /></span>
                        <div>
                            <h1 className="text-2xl font-extrabold leading-tight text-slate-900 dark:text-slate-100">Compras</h1>
                            <p className="text-sm text-slate-500">Registro de las compras a proveedores</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {IA_HABILITADA && (
                            <button type="button" onClick={() => navigate('/compras/factura-ia')} className="rounded-xl border-2 border-blue-300 bg-white px-4 py-3 text-base font-bold text-blue-700 hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-300">Cargar factura con IA</button>
                        )}
                        <button
                            type="button"
                            onClick={() => navigate('/compras/nueva')}
                            className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-base font-bold text-white shadow hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
                        >
                            <span aria-hidden="true" className="text-xl leading-none">+</span> Nueva compra
                        </button>
                    </div>
                </div>

                {/* Filtros en una sola barra */}
                <div className="mb-3 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-gray-800">
                    <label className="min-w-[240px] flex-1 text-xs font-semibold text-slate-500">Buscar
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Proveedor o número de factura…"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-gray-700 dark:text-slate-100"
                        />
                    </label>
                    <label className="text-xs font-semibold text-slate-500">Tipo
                        <select
                            value={tipoCompra}
                            onChange={(e) => { setTipoCompra(e.target.value as 'todas' | 'inventario_inicial' | 'normal'); setPage(1); }}
                            className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-gray-700 dark:text-slate-100"
                        >
                            <option value="todas">Todas las compras</option>
                            <option value="inventario_inicial">Inventario inicial</option>
                            <option value="normal">Compras normales</option>
                        </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-500">Desde
                        <input type="date" value={fechaInicio} onChange={(e) => { setFechaInicio(e.target.value); setPage(1); }} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-gray-700 dark:text-slate-100" />
                    </label>
                    <label className="text-xs font-semibold text-slate-500">Hasta
                        <input type="date" value={fechaFin} onChange={(e) => { setFechaFin(e.target.value); setPage(1); }} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-gray-700 dark:text-slate-100" />
                    </label>
                    {(fechaInicio || fechaFin) && (
                        <button type="button" onClick={() => { setFechaInicio(''); setFechaFin(''); setPage(1); }} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Limpiar fechas</button>
                    )}
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <button type="button" onClick={handleGenerateReporteList} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Reporte</button>
                        <button type="button" onClick={() => handleDownloadLibroCompras(fechaInicio, fechaFin)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Libro de compras</button>
                        <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-12" role="status" aria-label="Cargando compras">
                        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                    </div>
                )}

                {!loading && compras.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center dark:border-slate-600 dark:bg-gray-800">
                        <FaInfoCircle className="mx-auto mb-3 text-4xl text-slate-400" aria-hidden="true" />
                        <p className="text-lg text-slate-500">{search ? 'No se encontraron compras con ese criterio de búsqueda' : 'Todavía no hay compras registradas'}</p>
                    </div>
                )}

                {!loading && compras.length > 0 && (
                    <div className="relative overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-gray-800">
                        <table className="w-full min-w-[900px] border-collapse text-sm">
                            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left">Fecha</th>
                                    <th scope="col" className="px-4 py-3 text-left">Factura</th>
                                    <th scope="col" className="px-4 py-3 text-left">Proveedor</th>
                                    <th scope="col" className="px-4 py-3 text-left">Tipo</th>
                                    <th scope="col" className="px-4 py-3 text-left">Estado</th>
                                    <th scope="col" className="px-4 py-3 text-right">Productos</th>
                                    <th scope="col" className="px-4 py-3 text-left">Cajero</th>
                                    <th scope="col" className="px-4 py-3 text-right">Total (Gs.)</th>
                                    <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {compras.map((compra: any) => {
                                    const totalProductos = compra.detalles?.length || 0;
                                    const esCompraVacia = parseFloat(compra.total || 0) === 0;
                                    const esInventarioInicial = compra.observacion?.toLowerCase() === 'inventario inicial';
                                    const contado = compra.tipo === 'contado';
                                    const pagado = compra.estado === 'pagado';
                                    return (
                                        <tr key={compra.idcompra} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/40">
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">{new Date(compra.fecha).toLocaleDateString('es-PY')}</td>
                                            <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600">{compra.nro_factura}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-slate-900 dark:text-slate-100">{compra.nombre}</p>
                                                {esInventarioInicial && <span className="mt-1 inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800">Inventario inicial</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${contado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{contado ? 'Contado' : 'Crédito'}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${pagado ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-700'}`}>{pagado ? 'Pagado' : 'Pendiente'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600">{totalProductos}</td>
                                            <td className="px-4 py-3 text-slate-600">{compra.cajero_nombre || '—'}</td>
                                            <td className={`whitespace-nowrap px-4 py-3 text-right text-base font-extrabold ${esCompraVacia ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>{parseInt(compra.total).toLocaleString("es-PY")}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => { sessionStorage.setItem('compra-detalle-actual', JSON.stringify(compra)); navigate('/compras/detalle/' + compra.idcompra); }} className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700" title="Ver el detalle de la compra">
                                                        <FaEye aria-hidden="true" />Ver detalle
                                                    </button>
                                                    <button type="button" onClick={() => handleDelete(compra.idcompra)} className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Anular la compra">
                                                        <FaTrash aria-hidden="true" />Anular
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginación */}
                {!loading && compras.length > 0 && (
                    <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
                )}
            </div>

            {/* Modales */}
            <ModalError isOpen={!!errorMessage} onClose={() => setErrorMessage("")} message={errorMessage} />
            <ModalSuccess isOpen={!!successMessage} onClose={() => setSuccessMessage("")} message={successMessage} />
            <ModalAdvert
                isOpen={modalAdvertOpen}
                onClose={() => setModalAdvertOpen(false)}
                message={advertMessage}
                onConfirm={handleConfirmAdvert}
                confirmButtonText="Confirmar"
            />


        </div>
    );
};

export default ListarCompras;
