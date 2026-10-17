import SidebarLayout from '../../components/SidebarLayout';
import PaginaFormulario from '../../components/PaginaFormulario';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';
import CrearHorasExtras from '../../horas_extras/components/CrearHorasExtras';

function Contenido() {
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Nuevo hora extra" volverA="/horas-extras" textoVolver="Volver al listado">
      <CrearHorasExtras onSuccess={() => undefined} onClose={() => cerrar('/horas-extras')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
