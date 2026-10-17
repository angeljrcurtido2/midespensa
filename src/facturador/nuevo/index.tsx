import SidebarLayout from '../../components/SidebarLayout';
import PaginaFormulario from '../../components/PaginaFormulario';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';
import CrearFacturador from '../components/CrearFacturador';

function Contenido() {
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Nuevo facturador" volverA="/facturador" textoVolver="Volver a facturadores">
      <CrearFacturador onSuccess={() => undefined} onClose={() => cerrar('/facturador')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
