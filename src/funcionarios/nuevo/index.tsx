import SidebarLayout from '../../components/SidebarLayout';
import PaginaFormulario from '../../components/PaginaFormulario';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';
import CrearFuncionario from '../components/CrearFuncionario';

function Contenido() {
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Nuevo funcionario" volverA="/funcionarios" textoVolver="Volver a funcionarios">
      <CrearFuncionario onSuccess={() => undefined} onClose={() => cerrar('/funcionarios')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
