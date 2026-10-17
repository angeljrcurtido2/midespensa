import SidebarLayout from "../../components/SidebarLayout";
import PaginaFormulario from "../../components/PaginaFormulario";
import { useCerrarVentana } from "../../hooks/useAlVolverALaVentana";
import CrearProveedor from "../components/CrearProveedor";

function Contenido() {
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Nuevo proveedor" volverA="/proveedor" textoVolver="Volver al listado de proveedores">
      <CrearProveedor onSuccess={() => undefined} onClose={() => cerrar("/proveedor")} />
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
