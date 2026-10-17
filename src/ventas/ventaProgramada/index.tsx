"use client";
import SidebarLayout from "../../components/SidebarLayout";
import ListarVentasProgramadas from "./components/ListarVentasProgramadas";
export default function Page() {
  return (
    <div>
      <SidebarLayout>
        <ListarVentasProgramadas />
      </SidebarLayout>
    </div>
  );
}   