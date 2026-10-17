import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import CrearVentaProgramada from '../components/CrearVentaProgramada';

function Contenido() {
  const cerrar = useCerrarVentana();
  return <PaginaFormulario titulo="Nueva venta programada" volverA="/ventas/ventaProgramada" textoVolver="Volver a ventas programadas"><CrearVentaProgramada onSuccess={() => undefined} onClose={() => cerrar('/ventas/ventaProgramada')} /></PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
