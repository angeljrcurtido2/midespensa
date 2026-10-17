import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import EditarFacturador from '../../components/EditarFacturador';

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Editar facturador" volverA="/facturador" textoVolver="Volver a facturadores">
      <EditarFacturador id={id ?? ''} onSuccess={() => undefined} onClose={() => cerrar('/facturador')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
