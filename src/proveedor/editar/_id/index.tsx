import { useParams } from "react-router-dom";
import SidebarLayout from "../../../components/SidebarLayout";
import PaginaFormulario from "../../../components/PaginaFormulario";
import { useCerrarVentana } from "../../../hooks/useAlVolverALaVentana";
import EditarProveedor from "../../components/EditarProveedor";

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Editar proveedor" volverA="/proveedor" textoVolver="Volver al listado de proveedores">
      <EditarProveedor id={id ?? ""} onSuccess={() => undefined} onClose={() => cerrar("/proveedor")} />
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
