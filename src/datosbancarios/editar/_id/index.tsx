import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import EditarDatosBancarios from '../../components/EditarDatosBancarios';

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  return <PaginaFormulario titulo="Editar dato bancario" volverA="/datosbancarios" textoVolver="Volver a datos bancarios"><EditarDatosBancarios id={id ?? ''} onSuccess={() => undefined} onClose={() => cerrar('/datosbancarios')} /></PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
