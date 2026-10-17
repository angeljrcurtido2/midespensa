import SidebarLayout from '../../components/SidebarLayout';
import PaginaFormulario from '../../components/PaginaFormulario';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';
import CrearDatosBancarios from '../components/CrearDatosBancarios';

function Contenido() {
  const cerrar = useCerrarVentana();
  return <PaginaFormulario titulo="Nuevo dato bancario" volverA="/datosbancarios" textoVolver="Volver a datos bancarios"><CrearDatosBancarios onSuccess={() => undefined} onClose={() => cerrar('/datosbancarios')} /></PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
