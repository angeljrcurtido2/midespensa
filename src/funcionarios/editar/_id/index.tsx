import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import EditarFuncionario from '../../components/EditarFuncionario';

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Editar funcionario" volverA="/funcionarios" textoVolver="Volver a funcionarios">
      <EditarFuncionario id={id ?? ''} onSuccess={() => undefined} onClose={() => cerrar('/funcionarios')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
