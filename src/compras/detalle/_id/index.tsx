import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import ModalDetalleCompra from '../../components/Modals/ModalDetalleCompra';

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  let compra: any = null;
  try { compra = JSON.parse(sessionStorage.getItem('compra-detalle-actual') || 'null'); } catch { compra = null; }
  return <PaginaFormulario titulo="Detalle de compra" volverA="/compras" textoVolver="Volver a compras">
    {compra && String(compra.idcompra) === String(id)
      ? <ModalDetalleCompra isOpen compra={compra} ventana onClose={() => cerrar('/compras')} />
      : <p className="rounded-xl bg-amber-50 p-5 text-amber-800">No se encontró la compra seleccionada. Volvé al listado y elegí una compra.</p>}
  </PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
