import SidebarLayout from '../../../../components/SidebarLayout';
import PaginaFormulario from '../../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../../hooks/useAlVolverALaVentana';
import AbrirCajaForm from '../../../components/CrearAperturaCaja';

function Contenido() {
  const cerrar = useCerrarVentana();
  return <PaginaFormulario titulo="Abrir caja" volverA="/movimiento/cierrecaja" textoVolver="Volver a movimientos"><AbrirCajaForm onSuccess={() => undefined} onClose={() => cerrar('/movimiento/cierrecaja')} /></PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
