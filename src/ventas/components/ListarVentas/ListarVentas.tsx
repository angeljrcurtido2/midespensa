"use client";

import { useEffect, useState } from "react";
import { FaShoppingBag, FaEye, FaTrash } from 'react-icons/fa';
import { PaginaListado, EncabezadoListado, BotonPrincipal, BotonSecundario, BarraFiltros, CampoBusqueda, TablaListado, AccionFila, Insignia, type Columna } from '../../../components/listado/Listado';
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

  const columnas: Columna<any>[] = [
    { clave: 'cliente', titulo: 'Cliente', render: (v) => (<><p className="font-extrabold text-stone-900 dark:text-stone-100">{v.nombre_cliente}</p><p className="text-xs text-stone-500">{v.documento_cliente} · N° {v.nro_ticket || v.nro_factura || v.idventa}</p></>) },
    { clave: 'fecha', titulo: 'Fecha', sinSalto: true, render: (v) => new Date(v.fecha).toLocaleDateString('es-PY') },
    { clave: 'tipo', titulo: 'Tipo', render: (v) => { const credito = String(v.tipo || '').toLowerCase() === 'credito'; return <Insignia color={credito ? 'ambar' : 'verde'}>{credito ? 'Fiado' : 'Contado'}</Insignia>; } },
    { clave: 'total', titulo: 'Total (Gs.)', alinear: 'right', sinSalto: true, render: (v) => <span className="text-lg font-black text-stone-900 dark:text-stone-50">{parseInt(v.total).toLocaleString('es-PY')}</span> },
    ...(isAdmin ? [{ clave: 'ganancia', titulo: 'Ganancia (Gs.)', alinear: 'right' as const, sinSalto: true, render: (v: any) => { const g = parseInt(v.total_ganancia); return <span className={`font-bold ${g < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{g.toLocaleString('es-PY')}</span>; } }] : []),
  ];

  return (
    <PaginaListado>
      <EncabezadoListado
        icono={<FaShoppingBag />}
        titulo="Ventas"
        subtitulo="Todo lo que vendiste, ordenado por fecha"
        acciones={<BotonPrincipal onClick={() => navigate('/ventas/nueva')}>Nueva venta</BotonPrincipal>}
      />

      <BarraFiltros
        derecha={(
          <>
            <BotonSecundario onClick={() => void handleGenerateReporteList()}>Reporte</BotonSecundario>
            <BotonSecundario onClick={() => void handleDownloadLibroVentas(fecha_inicio || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], fecha_fin || new Date().toISOString().split('T')[0])}>Libro de ventas</BotonSecundario>
            <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
          </>
        )}
      >
        <CampoBusqueda valor={search} onCambio={(v) => { setSearch(v); setPage(1); }} placeholder="Cliente, documento o número…" />
        <label className="text-xs font-extrabold uppercase tracking-wide text-stone-500">Desde
          <input type="date" value={fecha_inicio} onChange={(e) => { setFechaInicio(e.target.value); setPage(1); }} className="mt-1 block px-3 py-2 text-sm font-normal normal-case text-stone-900" />
        </label>
        <label className="text-xs font-extrabold uppercase tracking-wide text-stone-500">Hasta
          <input type="date" value={fecha_fin} onChange={(e) => { setFechaFin(e.target.value); setPage(1); }} className="mt-1 block px-3 py-2 text-sm font-normal normal-case text-stone-900" />
        </label>
        {(fecha_inicio || fecha_fin) && (
          <button type="button" onClick={() => { setFechaInicio(''); setFechaFin(''); setPage(1); }} className="rounded-full px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">Limpiar fechas</button>
        )}
      </BarraFiltros>

      <TablaListado
        columnas={columnas}
        filas={ventas}
        claveFila={(v: any) => v.idventa}
        cargando={loading}
        vacio={search ? 'No se encontraron ventas con ese criterio de búsqueda' : 'Todavía no hay ventas registradas'}
        acciones={(venta: any) => (
          <>
            <AccionFila
              icono={<FaEye />}
              texto="Ver detalle"
              titulo="Ver el detalle de la venta"
              onClick={() => { sessionStorage.setItem('venta-detalle-actual', JSON.stringify(venta)); navigate(`/ventas/detalle/${venta.idventa}`); }}
            />
            {isAdmin && <AccionFila tipo="peligro" icono={<FaTrash />} texto="Anular" titulo="Anular la venta" onClick={() => handleDelete(venta.idventa)} />}
          </>
        )}
      />

      {!loading && ventas.length > 0 && <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />}

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

export default ListarVentas;
