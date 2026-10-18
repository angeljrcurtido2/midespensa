import { IA_HABILITADA } from '../../config/featureFlags';
'use client';

import { useEffect, useState } from 'react';
import { FaShoppingCart, FaEye, FaTrash } from 'react-icons/fa';
import { PaginaListado, EncabezadoListado, BotonPrincipal, BotonSecundario, BarraFiltros, CampoBusqueda, TablaListado, AccionFila, Insignia, type Columna } from '../../components/listado/Listado';
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

    const columnas: Columna<any>[] = [
        { clave: 'proveedor', titulo: 'Proveedor', render: (c) => (<><p className="font-extrabold text-stone-900 dark:text-stone-100">{c.nombre}</p><p className="font-mono text-xs text-stone-500">Factura {c.nro_factura}</p>{c.observacion?.toLowerCase() === 'inventario inicial' && <span className="mt-1 inline-block"><Insignia color="ambar">Inventario inicial</Insignia></span>}</>) },
        { clave: 'fecha', titulo: 'Fecha', sinSalto: true, render: (c) => new Date(c.fecha).toLocaleDateString('es-PY') },
        { clave: 'tipo', titulo: 'Tipo', render: (c) => <Insignia color={c.tipo === 'contado' ? 'verde' : 'ambar'}>{c.tipo === 'contado' ? 'Contado' : 'A crédito'}</Insignia> },
        { clave: 'estado', titulo: 'Estado', render: (c) => <Insignia color={c.estado === 'pagado' ? 'azul' : 'rojo'}>{c.estado === 'pagado' ? 'Pagado' : 'Pendiente'}</Insignia> },
        { clave: 'productos', titulo: 'Productos', alinear: 'right', render: (c) => c.detalles?.length || 0 },
        { clave: 'cajero', titulo: 'Cajero', render: (c) => c.cajero_nombre || '—' },
        { clave: 'total', titulo: 'Total (Gs.)', alinear: 'right', sinSalto: true, render: (c) => <span className={`text-lg font-black ${parseFloat(c.total || 0) === 0 ? 'text-stone-400' : 'text-stone-900 dark:text-stone-50'}`}>{parseInt(c.total).toLocaleString('es-PY')}</span> },
    ];

    return (
        <PaginaListado>
            <EncabezadoListado
                icono={<FaShoppingCart />}
                titulo="Compras"
                subtitulo="Lo que le comprás a tus proveedores"
                acciones={(
                    <>
                        {IA_HABILITADA && <BotonSecundario onClick={() => navigate('/compras/factura-ia')}>Cargar factura con IA</BotonSecundario>}
                        <BotonPrincipal onClick={() => navigate('/compras/nueva')}>Nueva compra</BotonPrincipal>
                    </>
                )}
            />

            <BarraFiltros
                derecha={(
                    <>
                        <BotonSecundario onClick={handleGenerateReporteList}>Reporte</BotonSecundario>
                        <BotonSecundario onClick={() => handleDownloadLibroCompras(fechaInicio, fechaFin)}>Libro de compras</BotonSecundario>
                        <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
                    </>
                )}
            >
                <CampoBusqueda valor={search} onCambio={(v) => { setSearch(v); setPage(1); }} placeholder="Proveedor o número de factura…" />
                <label className="text-xs font-extrabold uppercase tracking-wide text-stone-500">Tipo
                    <select
                        value={tipoCompra}
                        onChange={(e) => { setTipoCompra(e.target.value as 'todas' | 'inventario_inicial' | 'normal'); setPage(1); }}
                        className="mt-1 block px-3 py-2 text-sm font-normal normal-case text-stone-900"
                    >
                        <option value="todas">Todas las compras</option>
                        <option value="inventario_inicial">Inventario inicial</option>
                        <option value="normal">Compras normales</option>
                    </select>
                </label>
                <label className="text-xs font-extrabold uppercase tracking-wide text-stone-500">Desde
                    <input type="date" value={fechaInicio} onChange={(e) => { setFechaInicio(e.target.value); setPage(1); }} className="mt-1 block px-3 py-2 text-sm font-normal normal-case text-stone-900" />
                </label>
                <label className="text-xs font-extrabold uppercase tracking-wide text-stone-500">Hasta
                    <input type="date" value={fechaFin} onChange={(e) => { setFechaFin(e.target.value); setPage(1); }} className="mt-1 block px-3 py-2 text-sm font-normal normal-case text-stone-900" />
                </label>
                {(fechaInicio || fechaFin) && (
                    <button type="button" onClick={() => { setFechaInicio(''); setFechaFin(''); setPage(1); }} className="rounded-full px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">Limpiar fechas</button>
                )}
            </BarraFiltros>

            <TablaListado
                columnas={columnas}
                filas={compras}
                claveFila={(c: any) => c.idcompra}
                cargando={loading}
                vacio={search ? 'No se encontraron compras con ese criterio de búsqueda' : 'Todavía no hay compras registradas'}
                acciones={(compra: any) => (
                    <>
                        <AccionFila
                            icono={<FaEye />}
                            texto="Ver detalle"
                            titulo="Ver el detalle de la compra"
                            onClick={() => { sessionStorage.setItem('compra-detalle-actual', JSON.stringify(compra)); navigate('/compras/detalle/' + compra.idcompra); }}
                        />
                        <AccionFila tipo="peligro" icono={<FaTrash />} texto="Anular" titulo="Anular la compra" onClick={() => handleDelete(compra.idcompra)} />
                    </>
                )}
            />

            {!loading && compras.length > 0 && <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />}

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

        </PaginaListado>
    );
};

export default ListarCompras;
