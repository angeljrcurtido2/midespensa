import SidebarLayout from "../../components/SidebarLayout";
import CrearVenta from "../components/CrearVenta";

/** Nueva venta como pantalla completa (antes era una ventana emergente). */
export default function Page() {
  return (
    <SidebarLayout>
      <CrearVenta pagina />
    </SidebarLayout>
  );
}
