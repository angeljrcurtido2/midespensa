import SidebarLayout from '../../components/SidebarLayout';
import PaginaFormulario from '../../components/PaginaFormulario';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';
import CrearEmpleados from '../components/CrearEmpleados';

function Contenido() {
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Nuevo empleado" volverA="/empleados" textoVolver="Volver a empleados">
      <CrearEmpleados onSuccess={() => undefined} onClose={() => cerrar('/empleados')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
