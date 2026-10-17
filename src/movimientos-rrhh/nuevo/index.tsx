import SidebarLayout from '../../components/SidebarLayout';
import PaginaFormulario from '../../components/PaginaFormulario';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';
import CrearMovimientoRRHH from '../components/CrearMovimientoRRHH';

function Contenido() {
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Nuevo movimiento rrhh" volverA="/movimientos-rrhh" textoVolver="Volver al listado">
      <CrearMovimientoRRHH onSuccess={() => undefined} onClose={() => cerrar('/movimientos-rrhh')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
