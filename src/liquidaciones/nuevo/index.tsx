import SidebarLayout from '../../components/SidebarLayout';
import PaginaFormulario from '../../components/PaginaFormulario';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';
import CrearLiquidacion from '../components/CrearLiquidacion';

function Contenido() {
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Nuevo liquidacion" volverA="/liquidaciones" textoVolver="Volver al listado">
      <CrearLiquidacion onSuccess={() => undefined} onClose={() => cerrar('/liquidaciones')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
