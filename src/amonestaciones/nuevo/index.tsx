import SidebarLayout from '../../components/SidebarLayout';
import PaginaFormulario from '../../components/PaginaFormulario';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';
import CrearAmonestaciones from '../components/CrearAmonestaciones';

function Contenido() {
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Nuevo amonestacion" volverA="/amonestaciones" textoVolver="Volver al listado">
      <CrearAmonestaciones onSuccess={() => undefined} onClose={() => cerrar('/amonestaciones')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
