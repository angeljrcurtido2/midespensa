"use client";

import { useEffect, useState } from "react";
import { FaShoppingBag, FaEye, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import { useAlVolverALaVentana } from "../../../hooks/useAlVolverALaVentana";
import ModalError from "../../../components/ModalError";
import ModalSuccess from "../../../components/ModalSuccess";
import ModalAdvert from "../../../components/ModalAdvert";
import { deleteVenta, getVentasPaginated, getReporteVentasData, generateLibroVentasPDF } from '../../../services/ventas';
import { getCargoUsuario } from "../../../services/usuarios";
import type { ReporteVentasResponse } from '../../../types/reporte.types';
import SelectPage from "../../../components/SelectPage";
import SelectPagination from "../../../components/SelectPagination";
import { descargarPdfBase64 } from "../../../utils/descargarPdf";

const ListarVentas = () => {
  const [ventas, setVentas] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
  const [advertMessage, setAdvertMessage] = useState("");
  const [advertAction, setAdvertAction] = useState<(() => void) | null>(null);
  const [loading, setLoading] = useState(false);

  const [fecha_inicio, setFechaInicio] = useState<string>('');
  const [fecha_fin, setFechaFin] = useState<string>('');

  const [cargo, setCargo] = useState("");
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
      const res = await getVentasPaginated({ page, limit, search, fecha_inicio, fecha_fin });
      setVentas(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Error al obtener ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Al volver a esta ventana (por ejemplo después de registrar una venta) se actualiza la lista.
  useAlVolverALaVentana(() => { void fetchVentas(); });

  useEffect(() => {
    fetchVentas();
  }, [page, limit, search, fecha_inicio, fecha_fin]);

  const handleDelete = (id: number) => {
    setAdvertMessage('¿Estás seguro de que deseas anular esta venta?');
    setAdvertAction(() => async () => {
      try {
        await deleteVenta(id);
        setSuccessMessage('  Venta anulada exitosamente');
        fetchVentas();
      } catch (error) {
        console.error('Error al anular venta:', error);
        setErrorMessage('  No se pudo anular la venta');
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
      const fechaInicio = fecha_inicio || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const fechaFin = fecha_fin || new Date().toISOString().split('T')[0];

      const res = await getReporteVentasData({ search, fecha_inicio: fechaInicio, fecha_fin: fechaFin, tipo: '' });

      const ventas = res.data.data || res.data;
      const filtros = res.data.filtros || {};
      const estadisticas = res.data.estadisticas || {};

      const totalVentas = estadisticas.total_ventas || ventas.length;
      const ventasContado = estadisticas.ventas_contado || ventas.filter((v: any) => v.tipo.toLowerCase() === 'contado').length;
      const ventasCredito = estadisticas.ventas_credito || ventas.filter((v: any) => v.tipo.toLowerCase() === 'credito').length;

      const reporteTransformado: ReporteVentasResponse = {
        message: '  Reporte de ventas generado correctamente',
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
            titulo: 'Reporte de Ventas',
            fecha_inicio: filtros.fecha_inicio,
            fecha_fin: filtros.fecha_fin,
            total_ventas: totalVentas,
            ventas_contado: ventasContado,
            ventas_credito: ventasCredito,
            monto_total_ventas: estadisticas.monto_total_ventas || '0',
            monto_total_descuentos: estadisticas.monto_total_descuentos || '0',
            ganancia_total: estadisticas.ganancia_total || '0',
            cantidad_total_productos: estadisticas.cantidad_total_productos || 0,
            ventas: ventas
          }
        }
      };

      sessionStorage.setItem('ventas-reporte-actual', JSON.stringify(reporteTransformado));
      navigate('/ventas/reporte');
    } catch (error) {
      console.error("  Error al generar reporte de ventas:", error);
      setErrorMessage("  Error al generar el reporte");
    }
  };

  const handleDownloadLibroVentas = async (fechaInicio: string, fechaFin: string) => {
    try {
      console.log('📚 Descargando Libro de Ventas SET...');
      const res = await generateLibroVentasPDF({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      descargarPdfBase64(
        res.data.reportePDFBase64,
        `Libro-Ventas-SET-${fechaInicio}-${fechaFin}.pdf`
      );
      console.log('  Libro de Ventas descargado exitosamente');
    } catch (error) {
      console.error("  Error al generar Libro de Ventas:", error);
      setErrorMessage("  Error al generar el Libro de Ventas");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-4 dark:bg-gray-900 sm:px-6" style={{ scrollbarGutter: 'stable' }}>
      <div className="mx-auto w-full max-w-[1800px]">
        {/* Encabezado compacto: título y la acción principal a la vista */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><FaShoppingBag aria-hidden="true" /></span>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight text-slate-900 dark:text-slate-100">Ventas</h1>
              <p className="text-sm text-slate-500">Registro de las ventas del sistema</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/ventas/nueva")}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            <span aria-hidden="true" className="text-xl leading-none">+</span> Nueva venta
          </button>
        </div>

        {/* Filtros en una sola barra */}
        <div className="mb-3 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-gray-800">
          <label className="min-w-[240px] flex-1 text-xs font-semibold text-slate-500">Buscar
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cliente, documento o número…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-gray-700 dark:text-slate-100"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">Desde
            <input type="date" value={fecha_inicio} onChange={(e) => { setFechaInicio(e.target.value); setPage(1); }} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-gray-700 dark:text-slate-100" />
          </label>
          <label className="text-xs font-semibold text-slate-500">Hasta
            <input type="date" value={fecha_fin} onChange={(e) => { setFechaFin(e.target.value); setPage(1); }} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-gray-700 dark:text-slate-100" />
          </label>
          {(fecha_inicio || fecha_fin) && (
            <button type="button" onClick={() => { setFechaInicio(''); setFechaFin(''); setPage(1); }} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Limpiar fechas</button>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void handleGenerateReporteList()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Reporte</button>
            <button type="button" onClick={() => void handleDownloadLibroVentas(fecha_inicio || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], fecha_fin || new Date().toISOString().split('T')[0])} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Libro de ventas</button>
            <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12" role="status" aria-label="Cargando ventas">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
          </div>
        )}

        {!loading && ventas.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center dark:border-slate-600 dark:bg-gray-800">
            <FaInfoCircle className="mx-auto mb-3 text-4xl text-slate-400" aria-hidden="true" />
            <p className="text-lg text-slate-500">{search ? 'No se encontraron ventas con ese criterio de búsqueda' : 'Todavía no hay ventas registradas'}</p>
          </div>
        )}

        {!loading && ventas.length > 0 && (
          <div className="relative overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-gray-800">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">Fecha</th>
                  <th scope="col" className="px-4 py-3 text-left">N°</th>
                  <th scope="col" className="px-4 py-3 text-left">Cliente</th>
                  <th scope="col" className="px-4 py-3 text-left">Tipo</th>
                  <th scope="col" className="px-4 py-3 text-right">Total (Gs.)</th>
                  {isAdmin && <th scope="col" className="px-4 py-3 text-right">Ganancia (Gs.)</th>}
                  <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {ventas.map((venta: any) => {
                  const credito = String(venta.tipo || '').toLowerCase() === 'credito';
                  const ganancia = parseInt(venta.total_ganancia);
                  return (
                    <tr key={venta.idventa} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/40">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">{new Date(venta.fecha).toLocaleDateString('es-PY')}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{venta.nro_ticket || venta.nro_factura || venta.idventa}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{venta.nombre_cliente}</p>
                        <p className="text-xs text-slate-500">{venta.documento_cliente}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${credito ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{credito ? 'Crédito' : 'Contado'}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-base font-extrabold text-slate-900 dark:text-slate-100">{parseInt(venta.total).toLocaleString("es-PY")}</td>
                      {isAdmin && <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${ganancia < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{ganancia.toLocaleString("es-PY")}</td>}
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => { sessionStorage.setItem('venta-detalle-actual', JSON.stringify(venta)); navigate(`/ventas/detalle/${venta.idventa}`); }} className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700" title="Ver el detalle de la venta">
                            <FaEye aria-hidden="true" />Ver detalle
                          </button>
                          {isAdmin && (
                            <button type="button" onClick={() => handleDelete(venta.idventa)} className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Anular la venta">
                              <FaTrash aria-hidden="true" />Anular
                            </button>
                          )}
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
        {!loading && ventas.length > 0 && (
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

export default ListarVentas;
