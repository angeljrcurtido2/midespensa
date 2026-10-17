import { useParams } from "react-router-dom";
import SidebarLayout from "../../../components/SidebarLayout";
import PaginaFormulario from "../../../components/PaginaFormulario";
import { useCerrarVentana } from "../../../hooks/useAlVolverALaVentana";
import EditarProducto from "../../components/EditarProductos";

function Contenido() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  return (
    <PaginaFormulario titulo="Editar producto" volverA="/productos" textoVolver="Volver al listado de productos" stickyContenido>
      <EditarProducto id={id ?? ""} onSuccess={() => undefined} onClose={() => cerrar("/productos")} />
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
