import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../../components/SidebarLayout';
import PaginaFormulario from '../../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../../hooks/useAlVolverALaVentana';
import CajaResumen from '../../../components/CierreCaja/CajaResumen';

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  return <PaginaFormulario titulo="Resumen de caja" volverA="/movimiento/cierrecaja" textoVolver="Volver a movimientos"><CajaResumen idmovimiento={Number(id) || 0} onClose={() => cerrar('/movimiento/cierrecaja')} /></PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
