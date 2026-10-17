import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../../components/SidebarLayout';
import PaginaFormulario from '../../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../../hooks/useAlVolverALaVentana';
import CobroDeudaVenta from '../../../components/CobroDeudaVenta/CobroDeudaVenta';
import ModalComprobantePago from '../../../components/ModalsVenta/ModalComprobantePago';
import type { ComprobantePago } from '../../../components/interface';

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  const pagoRegistrado = useRef(false);
  const [comprobante, setComprobante] = useState<ComprobantePago | null>(null);
  const [mostrarComprobante, setMostrarComprobante] = useState(false);
  let datos: { id: number; montoMaximo: number } | null = null;
  try { datos = JSON.parse(sessionStorage.getItem('deuda-venta-actual') || 'null'); } catch { datos = null; }

  if (!datos || String(datos.id) !== String(id)) return <PaginaFormulario titulo="Cobro de venta a crédito" volverA="/ventas/cobrodeuda" textoVolver="Volver a créditos"><p className="rounded-xl bg-amber-50 p-5 text-amber-800">No se encontró la deuda seleccionada. Volvé al listado y elegí una deuda.</p></PaginaFormulario>;

  return <PaginaFormulario titulo="Registrar cobro al cliente" volverA="/ventas/cobrodeuda" textoVolver="Volver a créditos">
    <CobroDeudaVenta iddeuda={datos.id} montoMaximo={datos.montoMaximo} onSuccess={() => { pagoRegistrado.current = true; }} onClose={() => { if (pagoRegistrado.current) setMostrarComprobante(true); else cerrar('/ventas/cobrodeuda'); }} setComprobante={setComprobante} setShowComprobante={setMostrarComprobante} />
    {mostrarComprobante && comprobante && <ModalComprobantePago comprobante={comprobante} onClose={() => { setMostrarComprobante(false); cerrar('/ventas/cobrodeuda'); }} />}
  </PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
