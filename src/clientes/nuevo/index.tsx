import SidebarLayout from "../../components/SidebarLayout";
import PaginaFormulario from "../../components/PaginaFormulario";
import { useCerrarVentana } from "../../hooks/useAlVolverALaVentana";
import CrearCliente from "../components/CrearCliente";

function Contenido() {
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Nuevo cliente" volverA="/clientes" textoVolver="Volver al listado de clientes">
      <CrearCliente onSuccess={() => undefined} onClose={() => cerrar("/clientes")} />
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
