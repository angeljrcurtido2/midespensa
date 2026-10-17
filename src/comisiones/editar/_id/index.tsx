import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import EditarComisiones from '../../components/EditarComisiones';

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Editar comision" volverA="/comisiones" textoVolver="Volver al listado">
      <EditarComisiones id={id ?? ''} onSuccess={() => undefined} onClose={() => cerrar('/comisiones')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
