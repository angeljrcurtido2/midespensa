import SidebarLayout from "../../components/SidebarLayout";
import CrearCompra from "../components/CrearCompra";

/** Nueva compra como pantalla completa (antes era una ventana emergente). */
export default function Page() {
  return (
    <SidebarLayout>
      <CrearCompra pagina />
    </SidebarLayout>
  );
}
