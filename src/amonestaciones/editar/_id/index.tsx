import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import EditarAmonestaciones from '../../components/EditarAmonestaciones';

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Editar amonestacion" volverA="/amonestaciones" textoVolver="Volver al listado">
      <EditarAmonestaciones id={id ?? ''} onSuccess={() => undefined} onClose={() => cerrar('/amonestaciones')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
