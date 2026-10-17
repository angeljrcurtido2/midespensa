import SidebarLayout from '../../components/SidebarLayout';
import PaginaFormulario from '../../components/PaginaFormulario';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';
import CrearAsistencia from '../components/CrearAsistencia';

function Contenido() {
  const cerrar = useCerrarVentana();
  return <PaginaFormulario titulo="Nueva asistencia" volverA="/asistencia" textoVolver="Volver a asistencias"><CrearAsistencia onSuccess={() => undefined} onClose={() => cerrar('/asistencia')} /></PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
