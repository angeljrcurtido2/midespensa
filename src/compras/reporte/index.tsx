import SidebarLayout from '../../components/SidebarLayout';
import PaginaFormulario from '../../components/PaginaFormulario';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';
import { ReporteCompras } from '../components/ReporteCompras';
import { getReportComprasPDF } from '../../services/compras';
import { descargarPdfBase64, fechaParaNombreArchivo } from '../../utils/descargarPdf';

function Contenido() {
  const cerrar = useCerrarVentana();
  let datos: { reporte: any; search: string; fechaInicio: string; fechaFin: string } | null = null;
  try { datos = JSON.parse(sessionStorage.getItem('compras-reporte-actual') || 'null'); } catch { datos = null; }
  if (!datos) return <PaginaFormulario titulo="Reporte de compras" volverA="/compras" textoVolver="Volver a compras"><p className="rounded-xl bg-amber-50 p-5 text-amber-800">No hay un reporte de compras para mostrar.</p></PaginaFormulario>;
  const descargar = async (tipoFiltro: string) => {
    const res = await getReportComprasPDF(datos!.search, datos!.fechaInicio, datos!.fechaFin, tipoFiltro);
    descargarPdfBase64(res.data.reportePDFBase64, `Reporte-Compras-${fechaParaNombreArchivo()}.pdf`);
  };
  return <PaginaFormulario titulo="Reporte de compras" volverA="/compras" textoVolver="Volver a compras"><ReporteCompras reporte={datos.reporte} ventana onClose={() => cerrar('/compras')} onDownloadPDF={descargar} /></PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
