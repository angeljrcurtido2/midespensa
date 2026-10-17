import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import EditarMovimientoRRHH from '../../components/EditarMovimientoRRHH';

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Editar movimiento rrhh" volverA="/movimientos-rrhh" textoVolver="Volver al listado">
      <EditarMovimientoRRHH id={id ?? ''} onSuccess={() => undefined} onClose={() => cerrar('/movimientos-rrhh')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
