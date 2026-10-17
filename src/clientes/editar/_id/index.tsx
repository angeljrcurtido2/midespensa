import { useParams } from "react-router-dom";
import SidebarLayout from "../../../components/SidebarLayout";
import PaginaFormulario from "../../../components/PaginaFormulario";
import { useCerrarVentana } from "../../../hooks/useAlVolverALaVentana";
import EditarCliente from "../../components/EditarCliente";

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Editar cliente" volverA="/clientes" textoVolver="Volver al listado de clientes" ancho="max-w-none">
      <EditarCliente id={id ?? ""} onSuccess={() => undefined} onClose={() => cerrar("/clientes")} />
    </PaginaFormulario>
  );
}

export default function Page() {
  return (
    <SidebarLayout>
      <Contenido />
    </SidebarLayout>
  );
}
