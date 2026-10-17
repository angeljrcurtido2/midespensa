import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import EditarLiquidacion from '../../components/EditarLiquidacion';

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Editar liquidacion" volverA="/liquidaciones" textoVolver="Volver al listado">
      <EditarLiquidacion id={id ?? ''} onClose={() => cerrar('/liquidaciones')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
