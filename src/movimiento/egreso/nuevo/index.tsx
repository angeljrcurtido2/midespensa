import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import CrearEgresosVarios from '../../components/Egreso/CrearEgresosVarios';

function Contenido() {
  const cerrar = useCerrarVentana();
  return <PaginaFormulario titulo="Nuevo egreso" volverA="/movimiento/egreso" textoVolver="Volver a egresos"><CrearEgresosVarios onSuccess={() => undefined} onClose={() => cerrar('/movimiento/egreso')} /></PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
