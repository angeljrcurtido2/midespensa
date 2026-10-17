import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import CrearIngresosVarios from '../../components/CrearIngresosVarios';

function Contenido() {
  const cerrar = useCerrarVentana();
  return <PaginaFormulario titulo="Nuevo ingreso" volverA="/movimiento/ingreso" textoVolver="Volver a ingresos"><CrearIngresosVarios onSuccess={() => undefined} onClose={() => cerrar('/movimiento/ingreso')} /></PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
