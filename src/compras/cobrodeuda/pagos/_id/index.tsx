import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../../components/SidebarLayout';
import PaginaFormulario from '../../../../components/PaginaFormulario';
import ListarDetallesPagosDeuda from '../../../components/CobroDeudaCompra/ListarDetallesPagosDeuda';

function Contenido() {
  const { id } = useParams();
  return <PaginaFormulario titulo="Historial de pagos de compra" volverA="/compras/cobrodeuda" textoVolver="Volver a pagos"><ListarDetallesPagosDeuda iddeuda={Number(id) || 0} /></PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
