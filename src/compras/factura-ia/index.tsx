import SidebarLayout from '../../components/SidebarLayout';
import PaginaFormulario from '../../components/PaginaFormulario';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';
import CargarFacturaIA from '../components/CargarFacturaIA/CargarFacturaIA';

function Contenido() {
  const cerrar = useCerrarVentana();
  return <PaginaFormulario titulo="Cargar factura con IA" volverA="/compras" textoVolver="Volver a compras"><CargarFacturaIA onSuccess={() => undefined} onClose={() => cerrar('/compras')} /></PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
