import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import EditarAsistencia from '../../components/EditarAsistencia';

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  return <PaginaFormulario titulo="Editar asistencia" volverA="/asistencia" textoVolver="Volver a asistencias"><EditarAsistencia id={id ?? ''} onSuccess={() => undefined} onClose={() => cerrar('/asistencia')} /></PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
