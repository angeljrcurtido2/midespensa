import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../../components/SidebarLayout';
import PaginaFormulario from '../../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../../hooks/useAlVolverALaVentana';
import CobroDeudaCompra from '../../../components/CobroDeudaCompra/CobroDeudaCompra';
import ModalComprobantePago from '../../../../ventas/components/ModalsVenta/ModalComprobantePago';
import type { ComprobantePago } from '../../../../ventas/components/interface';

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  const pagoRegistrado = useRef(false);
  const [comprobante, setComprobante] = useState<ComprobantePago | null>(null);
  const [mostrarComprobante, setMostrarComprobante] = useState(false);
  let datos: { id: number; montoMaximo: number } | null = null;
  try { datos = JSON.parse(sessionStorage.getItem('deuda-compra-actual') || 'null'); } catch { datos = null; }

  if (!datos || String(datos.id) !== String(id)) {
    return <PaginaFormulario titulo="Pago de compra a crédito" volverA="/compras/cobrodeuda" textoVolver="Volver a pagos"><p className="rounded-xl bg-amber-50 p-5 text-amber-800">No se encontró la deuda seleccionada. Volvé al listado y elegí una deuda.</p></PaginaFormulario>;
  }

  return <PaginaFormulario titulo="Registrar pago a proveedor" volverA="/compras/cobrodeuda" textoVolver="Volver a pagos">
    <CobroDeudaCompra iddeuda={datos.id} montoMaximo={datos.montoMaximo} onSuccess={() => { pagoRegistrado.current = true; }} onClose={() => { if (pagoRegistrado.current) setMostrarComprobante(true); else cerrar('/compras/cobrodeuda'); }} setComprobante={setComprobante} setShowComprobante={setMostrarComprobante} />
    {mostrarComprobante && comprobante && <ModalComprobantePago comprobante={comprobante} isProviderPay onClose={() => { setMostrarComprobante(false); cerrar('/compras/cobrodeuda'); }} />}
  </PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
