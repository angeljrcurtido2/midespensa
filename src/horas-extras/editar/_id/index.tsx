import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import EditarHorasExtras from '../../../horas_extras/components/EditarHorasExtras';

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Editar hora extra" volverA="/horas-extras" textoVolver="Volver al listado">
      <EditarHorasExtras id={id ?? ''} onSuccess={() => undefined} onClose={() => cerrar('/horas-extras')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
