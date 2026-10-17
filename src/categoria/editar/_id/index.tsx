import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import EditarCategoria from '../../components/EditarCategoria';

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Editar categoria" volverA="/categoria" textoVolver="Volver a categorias">
      <EditarCategoria id={id ?? ''} onSuccess={() => undefined} onClose={() => cerrar('/categoria')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
