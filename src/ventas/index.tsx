// src/ventas/index.tsx
import ListarVentas from "./components/ListarVentas/ListarVentas"
import SidebarLayout from "../components/SidebarLayout"
export default function Page() {

    return (
        <SidebarLayout>
            <ListarVentas />
        </SidebarLayout>
    )
}