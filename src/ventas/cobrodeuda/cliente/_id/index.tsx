import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../../components/SidebarLayout';
import PaginaFormulario from '../../../../components/PaginaFormulario';
import DetallesCreditosCliente from '../../../components/CobroDeudaVenta/DetallesCreditosCliente';

function Contenido() {
  const { id } = useParams();
  let cliente: { idcliente: number; nombreCompleto: string; numDocumento: string } | null = null;
  try { cliente = JSON.parse(sessionStorage.getItem('deuda-venta-cliente-actual') || 'null'); } catch { cliente = null; }
  return <PaginaFormulario titulo="Deudas del cliente" volverA="/ventas/cobrodeuda" textoVolver="Volver a créditos">
    {cliente && String(cliente.idcliente) === String(id)
      ? <DetallesCreditosCliente {...cliente} />
      : <p className="rounded-xl bg-amber-50 p-5 text-amber-800">No se encontró el cliente seleccionado. Volvé al listado y elegí un cliente.</p>}
  </PaginaFormulario>;
}

export default function Page() { return <SidebarLayout><Contenido /></SidebarLayout>; }
