import { useEffect, useState } from 'react';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';
import { ReportListVentas } from '../components/ReportListVentas';
import type { ReporteVentasResponse } from '../../types/reporte.types';
import { generateReporteVentasPDF } from '../../services/ventas';
import { descargarPdfBase64, fechaParaNombreArchivo } from '../../utils/descargarPdf';

export default function ReporteVentasPage() {
  const cerrar = useCerrarVentana();
  const [reporte, setReporte] = useState<ReporteVentasResponse['datosReporte']['reporte'] | null>(null);
  useEffect(() => {
    try { setReporte(JSON.parse(sessionStorage.getItem('ventas-reporte-actual') || 'null')?.datosReporte?.reporte ?? null); }
    catch { setReporte(null); }
  }, []);
  const descargar = async (tipo: string) => {
    if (!reporte) return;
    const res = await generateReporteVentasPDF({ search: '', fecha_inicio: reporte.fecha_inicio, fecha_fin: reporte.fecha_fin, tipo });
    descargarPdfBase64(res.data.pdf, `Reporte-Ventas-${fechaParaNombreArchivo()}.pdf`);
  };
  if (!reporte) return <div className="p-8 text-slate-600">No se encontraron los datos del reporte. Generá el reporte nuevamente desde Ventas.</div>;
  return <ReportListVentas reporte={reporte} onClose={() => cerrar('/ventas')} onDownloadPDF={descargar} />;
}

