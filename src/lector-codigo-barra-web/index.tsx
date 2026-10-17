import SidebarLayout from '../components/SidebarLayout';
import PaginaFormulario from '../components/PaginaFormulario';
import LectorCodigoBarrasWeb from '../productos/components/LectorCodigoBarrasWeb';

export default function LectorCodigoBarrasWebPage() {
  return <SidebarLayout><PaginaFormulario titulo="Lector de código de barras para web" volverA="/productos" textoVolver="Volver a productos"><LectorCodigoBarrasWeb /></PaginaFormulario></SidebarLayout>;
}
