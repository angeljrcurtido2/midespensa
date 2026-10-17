import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaBook, FaFileAlt, FaCalculator } from 'react-icons/fa';
import SidebarLayout from '../../../../components/SidebarLayout';
import PaginaFormulario from '../../../../components/PaginaFormulario';
import { getIngresosPorMovimiento, getIngresosyEgresosPorMovimiento } from '../../../../services/ingreso';
import { getEgresosPorMovimiento } from '../../../../services/egreso';

function Contenido() {
  const { id } = useParams();
  const [error, setError] = useState('');
  const abrirReporte = async (tipo: 'ingresos' | 'egresos' | 'resumen') => {
    try {
      const movimiento = Number(id);
      const res = tipo === 'ingresos' ? await getIngresosPorMovimiento(movimiento) : tipo === 'egresos' ? await getEgresosPorMovimiento(movimiento) : await getIngresosyEgresosPorMovimiento(movimiento);
      const base64 = res.data?.comprobanteBase64;
      if (!base64) { setError('No hay un reporte disponible para este movimiento.'); return; }
      const blob = new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: 'application/pdf' });
      window.open(URL.createObjectURL(blob), '_blank');
      setError('');
    } catch (e) { console.error(e); setError('No se pudo generar el reporte.'); }
  };
  return <PaginaFormulario titulo="Reportes de caja" volverA="/movimiento/cierrecaja" textoVolver="Volver a movimientos">
    <div className="grid gap-3 sm:grid-cols-3">
      <button onClick={() => abrirReporte('ingresos')} className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-4 font-bold text-white"><FaBook /> Reporte de ingresos</button>
      <button onClick={() => abrirReporte('egresos')} className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-4 font-bold text-white"><FaFileAlt /> Reporte de egresos</button>
      <button onClick={() => abrirReporte('resumen')} className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-4 font-bold text-white"><FaCalculator /> Resumen de caja</button>
    </div>
    {error && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-800">{error}</p>}
  </PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
