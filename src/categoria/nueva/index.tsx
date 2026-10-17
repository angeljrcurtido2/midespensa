import SidebarLayout from '../../components/SidebarLayout';
import PaginaFormulario from '../../components/PaginaFormulario';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';
import CrearCategoria from '../components/CrearCategoria';

function Contenido() {
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Nueva categoria" volverA="/categoria" textoVolver="Volver a categorias">
      <CrearCategoria onSuccess={() => undefined} onClose={() => cerrar('/categoria')} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return <SidebarLayout><Contenido /></SidebarLayout>;
}
