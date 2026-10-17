import { useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import PaginaFormulario from "../../components/PaginaFormulario";
import { useCerrarVentana } from "../../hooks/useAlVolverALaVentana";
import CrearCompraRapida from "../../compras/components/CompraRapida/CrearCompraRapida";
import type { ProductoPrecargado } from "../../compras/components/CompraRapida/FormularioProducto/FormularioProducto";
import { CLAVE_PRECARGADO, EVENTO_PRECARGADO } from "../../components/asistente/AsistenteTuki";

/** Datos que dejó el asistente Tuki ("Cargar así"): se usan una vez y se borran. */
const tomarPrecargado = (): ProductoPrecargado | null => {
  try {
    const crudo = sessionStorage.getItem(CLAVE_PRECARGADO);
    if (!crudo) return null;
    sessionStorage.removeItem(CLAVE_PRECARGADO);
    return JSON.parse(crudo) as ProductoPrecargado;
  } catch { return null; }
};

function Contenido() {
  const cerrar = useCerrarVentana();
  const [precargado, setPrecargado] = useState<ProductoPrecargado | null>(tomarPrecargado);
  // Si la ventana ya estaba abierta cuando Tuki manda un producto, se completa el formulario igual.
  useEffect(() => {
    const alLlegar = () => { const p = tomarPrecargado(); if (p) setPrecargado(p); };
    window.addEventListener(EVENTO_PRECARGADO, alLlegar);
    return () => window.removeEventListener(EVENTO_PRECARGADO, alLlegar);
  }, []);
  return (
    <PaginaFormulario titulo="Nuevo producto" volverA="/productos" textoVolver="Volver al listado de productos">
      <CrearCompraRapida onSuccess={() => undefined} onClose={() => cerrar("/productos")} productoInicial={precargado} />
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
